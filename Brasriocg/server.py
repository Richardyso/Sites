#!/usr/bin/env python3
"""
Servidor HTTP simples para desenvolvimento local
Resolve problemas de CORS ao carregar arquivos JSON
"""

import http.server
import socketserver
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Adiciona headers CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def run_server():
    # Muda para o diretório do script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print("=" * 60)
        print("🚀 SERVIDOR LOCAL INICIADO COM SUCESSO!")
        print("=" * 60)
        print(f"\n📍 Acesse o projeto em: http://localhost:{PORT}")
        print(f"📍 Ou pelo IP: http://127.0.0.1:{PORT}")
        print("\n💡 Dicas:")
        print("   - Pressione Ctrl+C para parar o servidor")
        print("   - Atualize a página (F5) se fizer alterações")
        print("\n" + "=" * 60)
        print("Aguardando conexões...\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Servidor encerrado pelo usuário")
            sys.exit(0)

if __name__ == "__main__":
    run_server()

