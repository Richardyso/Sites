# Instruções para Validar Open Graph Tags

## Passos para Validação e Teste

### 1. Deploy no Netlify
Primeiro, faça o commit e push das alterações para o GitHub. O Netlify irá automaticamente fazer o deploy das mudanças.

### 2. Limpar Cache do WhatsApp
Para forçar o WhatsApp a buscar as novas informações:
- No WhatsApp Web ou Desktop: Ctrl + Shift + R (Windows) ou Cmd + Shift + R (Mac)
- No celular: Limpe o cache do aplicativo nas configurações

### 3. Ferramentas de Validação

#### Facebook Sharing Debugger (Recomendado)
1. Acesse: https://developers.facebook.com/tools/debug/
2. Cole a URL: https://rosafucsia.netlify.app/
3. Clique em "Debug"
4. Se necessário, clique em "Scrape Again" para forçar atualização

#### OpenGraph.xyz
1. Acesse: https://www.opengraph.xyz/
2. Cole a URL do site
3. Verifique se a imagem aparece corretamente

#### WhatsApp Preview Test
1. Envie a URL para você mesmo no WhatsApp
2. Aguarde alguns segundos para o preview carregar
3. Se não funcionar imediatamente, aguarde 24-48h para o cache expirar

### 4. Verificações Importantes

- [ ] A imagem og-image.png tem 1200x630 pixels
- [ ] A imagem está acessível em: https://rosafucsia.netlify.app/assets/images/og-image.png
- [ ] O arquivo robots.txt permite acesso aos crawlers
- [ ] As meta tags estão corretas no código fonte

### 5. Solução de Problemas

Se o preview ainda não funcionar:

1. **Verifique o console do navegador** ao acessar a URL da imagem diretamente
2. **Use o Network Inspector** para verificar se a imagem carrega com status 200
3. **Teste em modo incógnito** para evitar cache local
4. **Aguarde propagação** - Às vezes leva até 48h para o WhatsApp atualizar o cache

### 6. Alternativas

Se o problema persistir, considere:
- Usar formato JPEG em vez de PNG
- Reduzir o tamanho do arquivo (< 1MB)
- Verificar se o Netlify está servindo a imagem corretamente
- Adicionar um parâmetro de versão na URL da imagem (ex: ?v=2)
