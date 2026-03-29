import imaplib
import email
import socket
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
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
        self.email_user = os.getenv("EMAIL_USER", "")
        self.email_pass = os.getenv("EMAIL_PASS", "") # App Password (for IMAP)
        self.sg_api_key = os.getenv("SENDGRID_API_KEY", "")
        self.sg_sender = os.getenv("SENDGRID_SENDER", "")
        self.last_error = None
        
        if self.sg_api_key:
            self.sg_client = sendgrid.SendGridAPIClient(api_key=self.sg_api_key)
        
    def is_configured(self):
        return bool(self.email_user and self.email_pass and self.sg_api_key and self.sg_sender)

    def get_new_emails(self) -> List[Dict]:
        """Poll the inbox for unread HR emails."""
        if not (self.email_user and self.email_pass):
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
                
                # Basic Cleanup
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
        """Send an email using SendGrid (HTTP API)."""
        if not self.sg_api_key or not self.sg_sender:
            print(f"SendGrid Error: API Key or Sender missing. Not sending mail to {to_email}.")
            return

        try:
            from_email = Email(self.sg_sender)
            to_email_obj = To(to_email)
            content = Content("text/plain", body)
            mail = Mail(from_email, to_email_obj, subject, content)

            print(f"SENDGRID: Attempting to send email via HTTP API to {to_email}...")
            response = self.sg_client.client.mail.send.post(request_body=mail.get())
            
            if response.status_code >= 200 and response.status_code < 300:
                print(f"SENDGRID: Successfully sent email. Status: {response.status_code}")
            else:
                print(f"SENDGRID Error: Status Code {response.status_code}. Response: {response.body}")
            
        except Exception as e:
            print(f"SENDGRID Error: {type(e).__name__}: {e}")

    def send_reply(self, to_email: str, subject: str, body: str):
        """Send an automated HR response."""
        self.send_email(to_email, f"Re: {subject}", body)
