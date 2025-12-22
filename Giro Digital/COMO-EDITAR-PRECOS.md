# 📝 Como Editar os Preços do Site Giro Digital

## 🎯 Visão Geral

Os preços do site agora são gerenciados através de um arquivo JSON único, permitindo que você defina valores específicos para cada moeda (EUR, BRL, USD) sem depender de conversão automática.

## 📁 Arquivo de Configuração

Todos os preços estão no arquivo:
```
assets/js/precos-moedas.json
```

## 🔧 Como Editar

### 1. Abra o arquivo `precos-moedas.json`

### 2. Estrutura do Arquivo

O arquivo está organizado em seções:

#### **Moedas** - Símbolos e nomes das moedas
```json
"moedas": {
    "EUR": { "simbolo": "€", "nome": "Euro" },
    "BRL": { "simbolo": "R$", "nome": "Real Brasileiro" },
    "USD": { "simbolo": "$", "nome": "Dólar Americano" }
}
```

#### **Pacotes** - Preços dos pacotes principais
```json
"pacotes": {
    "starter": {
        "EUR": 99,      // Preço em Euro
        "BRL": 549,     // Preço em Real
        "USD": 109,     // Preço em Dólar
        "economia": {   // Valores de economia
            "EUR": 28,
            "BRL": 155,
            "USD": 31
        }
    }
}
```

#### **Serviços Avulsos** - Preços individuais
```json
"servicos_avulsos": {
    "design": {
        "logotipo": {
            "EUR": 20,
            "BRL": 110,
            "USD": 22
        }
    }
}
```

### 3. Para Alterar um Preço

1. Localize a seção do serviço/pacote
2. Encontre a moeda desejada (EUR, BRL ou USD)
3. Altere o valor numérico
4. Salve o arquivo

#### Exemplo: Alterar preço do Pacote Starter em Real
```json
"starter": {
    "EUR": 99,
    "BRL": 599,  // ← Altere este valor
    "USD": 109
}
```

## 📋 Todos os Preços Editáveis

### Pacotes
- **Starter**: `pacotes.starter.EUR/BRL/USD`
- **Crescimento**: `pacotes.crescimento.EUR/BRL/USD`
- **Premium**: `pacotes.premium.EUR/BRL/USD`
- **Economias**: `pacotes.[nome_pacote].economia.EUR/BRL/USD`

### Serviços de Design
- **Logótipo**: `servicos_avulsos.design.logotipo.EUR/BRL/USD`
- **Cartão de Visita**: `servicos_avulsos.design.cartao_visita.EUR/BRL/USD`
- **Manual de Marca**: `servicos_avulsos.design.manual_marca.EUR/BRL/USD`

### Serviços de Website
- **Landing Page**: `servicos_avulsos.websites.landing_page.EUR/BRL/USD`
- **Site 5 Páginas**: `servicos_avulsos.websites.site_5_paginas.EUR/BRL/USD`

### Serviços de Marketing
- **Gestão de Redes (mensal)**: `servicos_avulsos.marketing.gestao_redes_mensal.EUR/BRL/USD`

### Cards de Serviços (preços "A partir de")
- **Branding**: `servicos_cards.branding.preco_inicial.EUR/BRL/USD`
- **Redes Sociais**: `servicos_cards.redes_sociais.preco_inicial.EUR/BRL/USD`
- **Websites**: `servicos_cards.websites.preco_inicial.EUR/BRL/USD`
- **Pacotes Completos**: `servicos_cards.pacotes_completos.preco_inicial.EUR/BRL/USD`

## ⚠️ Importante

- **Sempre use números inteiros** (sem casas decimais)
- **Não use aspas nos valores numéricos**
- **Mantenha a estrutura do JSON** (vírgulas, chaves, etc.)
- **Teste o site após alterações** para garantir que tudo funciona

## 💡 Dicas

1. **Consistência**: Mantenha uma lógica nos preços entre moedas
2. **Arredondamento**: Use valores redondos para facilitar (ex: 99, 199, 499)
3. **Backup**: Faça uma cópia do arquivo antes de editar
4. **Validação**: Use um validador JSON online se tiver dúvidas sobre a sintaxe

## 🔄 Aplicar Mudanças

Após salvar o arquivo:
1. Recarregue o site (F5 ou Ctrl+F5)
2. Teste mudando entre os idiomas para ver os diferentes preços
3. Verifique se todos os valores aparecem corretamente

## 📱 Suporte

Em caso de dúvidas ou problemas:
- Verifique se o JSON está válido
- Certifique-se de que não há erros de sintaxe
- Confirme que todos os campos necessários estão preenchidos