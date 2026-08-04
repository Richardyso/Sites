# ziron — STEGO DO K0V1L

Ferramenta web para esconder e extrair mensagens curtas em imagens, pensada para sobreviver a compressão de redes sociais (Instagram, Facebook, WhatsApp, etc.).

## Algoritmos

- **DCT+XOR** — steganografia em mid-band DCT com paridade XOR e redundância (implementação local do K0V1L).
- **ZTEG** — paridade de brilho médio em blocos 8×8, com repetição e voto majoritário.

No **decode**, os dois métodos são testados automaticamente; o usuário não precisa escolher qual usar. No **encode**, escolha DCT+XOR ou ZTEG na interface.

## Uso

1. Abra `index.html` (de preferência via um servidor local ou hospedagem).
2. Selecione uma imagem (≥ 1024×1024 recomendado).
3. Digite a mensagem, escolha o algoritmo de encode e clique em **ENCODE**.
4. Faça upload do PNG resultante na rede social; baixe de volta e use **DECODE**.

## Créditos

O método **ZTEG** (brightness parity / Ztegonography) é baseado no projeto:

- [zr0n/Ztegonography](https://github.com/zr0n/Ztegonography) — *Hide secret messages inside image files (work with Instagram, Facebook, WhatsApp, Twitter and many others)*

Código e ideia originais de Ztegonography © respectivos autores; integração neste site feita para coexistir com o codec DCT+XOR sem que um atrapalhe a leitura do outro.
