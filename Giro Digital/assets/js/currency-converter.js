// ===========================
// Giro Digital - Conversor de Moeda e Seletor de Idioma
// Detecta idioma e converte preços EUR <-> BRL
// ===========================

const CurrencyConverter = {
    // Taxa de câmbio EUR para BRL (defina sua taxa personalizada aqui)
    // Exemplo: 2.00 = 1 EUR = 2.00 BRL
    exchangeRate: 2.00,
    
    // Idioma atual (será definido na inicialização)
    currentLang: 'pt-PT',
    
    // Detectar se é Brasil baseado no idioma salvo ou do navegador
    isBrazil: () => {
        // Primeiro, verificar se há preferência salva
        const savedLang = localStorage.getItem('giro-language');
        if (savedLang) {
            return savedLang.toLowerCase() === 'pt-br';
        }
        // Caso contrário, usar idioma do navegador
        const lang = navigator.language || navigator.userLanguage || 'pt-PT';
        return lang.toLowerCase().startsWith('pt-br');
    },
    
    // Obter idioma atual
    getCurrentLang: () => {
        const savedLang = localStorage.getItem('giro-language');
        if (savedLang) {
            return savedLang;
        }
        const lang = navigator.language || navigator.userLanguage || 'pt-PT';
        return lang.toLowerCase().startsWith('pt-br') ? 'pt-BR' : 'pt-PT';
    },
    
    // Definir idioma
    setLanguage: (lang) => {
        localStorage.setItem('giro-language', lang);
        CurrencyConverter.currentLang = lang;
        CurrencyConverter.updatePrices();
        CurrencyConverter.updateLanguageSelector(lang);
    },
    
    // Atualizar visual do seletor de idioma
    updateLanguageSelector: (lang) => {
        const currentFlag = document.getElementById('current-flag');
        const currentLangText = document.getElementById('current-lang');
        const options = document.querySelectorAll('.language-selector__option');
        
        const isBrazil = lang.toLowerCase() === 'pt-br';
        
        if (currentFlag) {
            currentFlag.src = isBrazil 
                ? 'https://flagcdn.com/w40/br.png' 
                : 'https://flagcdn.com/w40/pt.png';
            currentFlag.alt = isBrazil ? 'Brasil' : 'Portugal';
        }
        
        if (currentLangText) {
            currentLangText.textContent = isBrazil ? 'BR' : 'PT';
        }
        
        // Marcar opção ativa
        options.forEach(option => {
            const optionLang = option.getAttribute('data-lang');
            if (optionLang.toLowerCase() === lang.toLowerCase()) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    },
    
    // Inicializar seletor de idioma
    initLanguageSelector: () => {
        const toggle = document.getElementById('language-toggle');
        const selector = document.getElementById('language-selector');
        const dropdown = document.getElementById('language-dropdown');
        const options = document.querySelectorAll('.language-selector__option');
        
        if (!toggle || !selector) return;
        
        // Toggle dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            selector.classList.toggle('active');
        });
        
        // Selecionar idioma
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = option.getAttribute('data-lang');
                CurrencyConverter.setLanguage(lang);
                selector.classList.remove('active');
            });
        });
        
        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) {
                selector.classList.remove('active');
            }
        });
        
        // Inicializar com idioma atual
        const currentLang = CurrencyConverter.getCurrentLang();
        CurrencyConverter.updateLanguageSelector(currentLang);
    },
    
    // Converter valor de EUR para BRL
    convertToBRL: (eurValue, rate) => {
        return Math.round(eurValue * rate);
    },
    
    // Formatar valor monetário
    formatCurrency: (value, isBrazil) => {
        if (isBrazil) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        } else {
            return new Intl.NumberFormat('pt-PT', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        }
    },
    
    // Atualizar símbolo da moeda
    updateCurrencySymbol: (isBrazil) => {
        const currencyElements = document.querySelectorAll('.pricing-card__currency');
        currencyElements.forEach(el => {
            el.textContent = isBrazil ? 'R$' : '€';
        });
    },
    
    // Atualizar valores em textos que contêm €
    updateTextWithEuro: (element, rate, isBrazil) => {
        // Salvar texto original se ainda não foi salvo
        const originalText = element.getAttribute('data-original-text') || element.textContent;
        if (!element.getAttribute('data-original-text')) {
            element.setAttribute('data-original-text', originalText);
        }
        
        if (!isBrazil) {
            // Restaurar texto original para Portugal
            element.textContent = originalText;
            return;
        }
        
        // Converter para Brasil
        let newText = originalText;
        const euroMatches = originalText.matchAll(/€(\d+)/g);
        
        for (const match of euroMatches) {
            const euroValue = parseFloat(match[1]);
            const brlValue = CurrencyConverter.convertToBRL(euroValue, rate);
            const formatted = CurrencyConverter.formatCurrency(brlValue, true);
            newText = newText.replace(match[0], formatted);
        }
        
        element.textContent = newText;
    },
    
    // Atualizar informações específicas para Brasil/Portugal
    updateLocalization: (isBrazil) => {
        // Esconder/mostrar nota sobre IVA
        const ivaNote = document.querySelector('[data-iva-note]');
        if (ivaNote) {
            ivaNote.style.display = isBrazil ? 'none' : 'block';
        }
        
        // Trocar MBway por PIX
        const mbwayPayment = document.querySelector('[data-payment-mbway]');
        const pixPayment = document.querySelector('[data-payment-pix]');
        
        if (mbwayPayment && pixPayment) {
            if (isBrazil) {
                // Brasil: esconder MBway, mostrar PIX
                mbwayPayment.style.display = 'none';
                pixPayment.style.display = 'flex';
            } else {
                // Portugal: mostrar MBway, esconder PIX
                mbwayPayment.style.display = 'flex';
                pixPayment.style.display = 'none';
            }
        }
    },
    
    // Atualizar valores nos elementos com data-euro
    updatePrices: () => {
        const isBrazil = CurrencyConverter.isBrazil();
        const rate = CurrencyConverter.exchangeRate;
        
        // Atualizar símbolo da moeda
        CurrencyConverter.updateCurrencySymbol(isBrazil);
        
        // Atualizar localização (IVA, métodos de pagamento)
        CurrencyConverter.updateLocalization(isBrazil);
        
        // Atualizar valores principais dos pacotes
        const priceAmounts = document.querySelectorAll('.pricing-card__amount[data-euro]');
        priceAmounts.forEach(element => {
            const euroValue = parseFloat(element.getAttribute('data-euro'));
            if (!isNaN(euroValue)) {
                if (isBrazil) {
                    const brlValue = CurrencyConverter.convertToBRL(euroValue, rate);
                    element.textContent = brlValue;
                } else {
                    element.textContent = euroValue;
                }
            }
        });
        
        // Atualizar valores em textos de poupança
        const savingsElements = document.querySelectorAll('.pricing-card__savings');
        savingsElements.forEach(element => {
            CurrencyConverter.updateTextWithEuro(element, rate, isBrazil);
        });
        
        // Atualizar preços dos serviços avulsos
        const individualServices = document.querySelectorAll('.individual-service li');
        individualServices.forEach(element => {
            CurrencyConverter.updateTextWithEuro(element, rate, isBrazil);
        });
        
        // Atualizar preços dos cards de serviços
        const servicePrices = document.querySelectorAll('.service-card__price');
        servicePrices.forEach(element => {
            CurrencyConverter.updateTextWithEuro(element, rate, isBrazil);
        });
    },
    
    // Inicializar conversor
    init: () => {
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                CurrencyConverter.initLanguageSelector();
                CurrencyConverter.updatePrices();
            });
        } else {
            CurrencyConverter.initLanguageSelector();
            CurrencyConverter.updatePrices();
        }
    }
};

// Auto-inicializar
CurrencyConverter.init();

