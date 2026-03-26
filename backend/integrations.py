import imaplib
import smtplib
import email
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
            
        try:
            # Explicitly use port 993 for SSL
            mail = imaplib.IMAP4_SSL(self.imap_server, 993, timeout=10)
            mail.login(self.email_user, self.email_pass)
            self.last_error = None
            mail.select("inbox")
            
            # Search for unread emails
            status, messages = mail.search(None, 'UNSEEN')
            email_ids = messages[0].split()
            
            inbound_mails = []
            for e_id in email_ids[-5:]: # Get last 5 unread
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

    def send_reply(self, to_email: str, subject: str, body: str):
        """Send an automated HR response."""
        if not self.email_user or not self.email_pass:
            print(f"SMTP Mock: Not sending mail to {to_email}. Credentials missing.")
            return

        try:
            msg = MIMEText(body)
            msg["Subject"] = f"Re: {subject}"
            msg["From"] = self.email_user
            msg["To"] = to_email
            
            with smtplib.SMTP_SSL(self.smtp_server, 465) as server:
                server.login(self.email_user, self.email_pass)
                server.send_message(msg)
            print(f"SMTP: Successfully sent HR reply to {to_email}")
            
        except Exception as e:
            print(f"SMTP Error: {e}")
