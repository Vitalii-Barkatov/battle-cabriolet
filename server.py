#!/usr/bin/env python3
"""
Simple HTTP Server for the Cabriolet Game
Run this script to start a server on port 9000
"""

import http.server
import socketserver
import os
import sys

PORT = 9000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '': 'application/octet-stream',
    }
    
    def log_message(self, format, *args):
        """Log to stdout instead of stderr"""
        sys.stdout.write("%s - %s\n" % (self.address_string(), format % args))
        
    def end_headers(self):
        """Add CORS headers to allow all origins"""
        self.send_header('Access-Control-Allow-Origin', '*')
        http.server.SimpleHTTPRequestHandler.end_headers(self)


def main():
    """Start HTTP server and print helpful message"""
    handler = CustomHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print("\n-----------------------------------------")
        print(f"Server running at http://localhost:{PORT}/")
        print("-----------------------------------------")
        print("Open your browser to view the game!")
        print("Press Ctrl+C to stop the server\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main() 