import http.server
import socketserver
import urllib.parse
import webbrowser
import uuid
import socket
import logging
from typing import Optional

logger = logging.getLogger("AgentForge.Auth")

class AuthCallbackHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress standard logging to keep terminal clean
        return

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.end_headers()

    def do_GET(self):
        # Add CORS header to GET as well
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        
        api_key = params.get('api_key', [None])[0]
        received_state = params.get('state', [None])[0]
        
        if api_key and received_state == self.server.state:
            self.server.received_key = api_key
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Simple success page for the user
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Successful</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #0f172a; }
                    .card { background: white; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px; }
                    h1 { color: #10b981; margin-bottom: 1rem; }
                    p { font-size: 1.125rem; color: #64748b; line-height: 1.5; }
                    .icon { font-size: 3rem; margin-bottom: 1rem; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">🚀</div>
                    <h1>Link Established!</h1>
                    <p>Your Agent Forge tactical unit is now synchronized. You can close this tab and return to your terminal.</p>
                </div>
            </body>
            </html>
            """
            self.wfile.write(html.encode())
        else:
            self.send_response(400)
            self.send_header('Content-type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b"Authentication failed: Invalid state or missing API key.")

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def run_auth_flow(server_url: str) -> Optional[str]:
    """
    Runs a temporary local server to receive the API key via browser redirect.
    """
    port = get_free_port()
    state = str(uuid.uuid4())
    
    with socketserver.TCPServer(("", port), AuthCallbackHandler) as httpd:
        httpd.state = state
        httpd.received_key = None
        
        pairing_url = f"{server_url}/agent/pair?port={port}&state={state}"
        
        print("\n" + "="*60)
        print("  AGENT FORGE - AUTHENTICATION REQUIRED")
        print("="*60)
        print(f"Opening browser to: {pairing_url}")
        print("Please authorize this agent in your browser...")
        print("Waiting for response... (Press Ctrl+C to cancel)")
        
        webbrowser.open(pairing_url)
        
        try:
            # Handle exactly one request
            httpd.handle_request()
        except KeyboardInterrupt:
            print("\nAuthentication cancelled.")
            return None
            
        if httpd.received_key:
            print("\nSuccess! Link established.")
            return httpd.received_key
        
    return None
