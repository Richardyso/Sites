# Fluxo de Navegação - Páginas Renomeadas

## Estrutura de Arquivos:
- **index.html** - Seleção do Material
- **drywall.html** - Tipo de Drywall  
- **material.html** - Método de Cálculo (antigo step2.html)
- **metragem.html** - Informar Metragem (antigo step3-metragem.html)
- **lista.html** - Seleção Manual (antigo step3-lista.html)
- **resultado.html** - Resultado Final

## Fluxo:
```
index.html → drywall.html → material.html → metragem.html → resultado.html
     ↓              ↓              ↓
material.html → lista.html → resultado.html
```

## Navegação:
- **index.html** → **material.html** (para materiais diretos)
- **index.html** → **drywall.html** → **material.html** (para Drywall)
- **material.html** → **metragem.html** ou **lista.html**
- **metragem.html** → **resultado.html**
- **lista.html** → **resultado.html**
- **resultado.html** → **index.html** (novo orçamento)
