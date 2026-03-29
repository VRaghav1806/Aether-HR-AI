import imaplib
import smtplib
import email
import socket
from email.mime.text import MIMEText
from email.header import decode_header
import os
import asyncio
from typing import List, Dict, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class MailClient:
    def __init__(self):
        self.imap_server = os.getenv("EMAIL_IMAP_SERVER", "imap.gmail.com")
        self.smtp_server = os.getenv("EMAIL_SMTP_SERVER", "smtp.gmail.com")
        self.email_user = os.getenv("EMAIL_USER", "")
        self.email_pass = os.getenv("EMAIL_PASS", "") # App Password
        self.last_error = None
        
    def is_configured(self):
        return bool(self.email_user and self.email_pass)

    def get_new_emails(self) -> List[Dict]:
        """Poll the inbox for unread HR emails."""
        if not self.is_configured():
            return []
            
        for attempt in range(3): # Try up to 3 times
            try:
                # Explicitly use port 993 for SSL
                mail = imaplib.IMAP4_SSL(self.imap_server, 993, timeout=15)
                mail.login(self.email_user, self.email_pass)
                self.last_error = None
                break
            except (socket.timeout, TimeoutError, imaplib.IMAP4.abort) as e:
                if attempt == 2: raise e
                print(f"IMAP Timeout (Attempt {attempt+1}/3)... retrying")
                continue
            except Exception as e:
                raise e
        
        try:
            mail.select("inbox")
            
            # Search for ALL emails to populate history, but AI only acts on new ones
            status, messages = mail.search(None, 'ALL')
            email_ids = messages[0].split()
            
            inbound_mails = []
            # Get last 10 emails to ensure the dashboard isn't empty
            for e_id in email_ids[-10:]:
                status, data = mail.fetch(e_id, '(RFC822)')
                raw_email = data[0][1]
                msg = email.message_from_bytes(raw_email)
                
                # Decode Subject
                subject, encoding = decode_header(msg.get("Subject", ""))[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding or "utf-8")
                
                # Decode From
                sender, encoding = decode_header(msg.get("From", ""))[0]
                if isinstance(sender, bytes):
                    sender = sender.decode(encoding or "utf-8")

                content = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            try:
                                content = part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8')
                                break
                            except:
                                continue
                else:
                    content = msg.get_payload(decode=True).decode(msg.get_content_charset() or 'utf-8')
                
                # Basic Cleanup: Strip excessive whitespace and long URLs to keep it readable
                content = "\n".join([line.strip() for line in content.splitlines() if line.strip()])
                if len(content) > 500:
                    content = content[:500] + "... [Content Truncated]"

                inbound_mails.append({
                    "id": e_id.decode(),
                    "sender": sender,
                    "subject": subject,
                    "content": content
                })
                
            mail.close()
            mail.logout()
            return inbound_mails
            
        except Exception as e:
            self.last_error = str(e)
            print(f"IMAP Error: {e}")
            return []

    def send_email(self, to_email: str, subject: str, body: str):
        """Send a general email notification."""
        if not self.email_user or not self.email_pass:
            print(f"SMTP Mock: Not sending mail to {to_email}. Credentials missing.")
            return

        try:
            msg = MIMEText(body)
            msg["Subject"] = subject
            msg["From"] = self.email_user
            msg["To"] = to_email
            
            with smtplib.SMTP_SSL(self.smtp_server, 465) as server:
                server.login(self.email_user, self.email_pass)
                server.send_message(msg)
            print(f"SMTP: Successfully sent email to {to_email}")
            
        except Exception as e:
            print(f"SMTP Error: {e}")

    def send_reply(self, to_email: str, subject: str, body: str):
        """Send an automated HR response."""
        self.send_email(to_email, f"Re: {subject}", body)
