// ===========================
// Giro Digital - Conversor de Moeda e Seletor de Idioma
// Detecta idioma e converte preços EUR <-> BRL
// ===========================

const CurrencyConverter = {
    // Taxas de câmbio EUR para outras moedas
    exchangeRates: {
        'BRL': 5.50,  // 1 EUR = 5.50 BRL
        'USD': 1.10,  // 1 EUR = 1.10 USD
        'EUR': 1.00   // Base
    },
    
    // Idioma atual (será definido na inicialização)
    currentLang: 'pt-PT',
    
    // Obter a moeda baseada no idioma
    getCurrencyForLang: (lang) => {
        const currencies = {
            'pt-PT': 'EUR',
            'pt-BR': 'BRL',
            'es-ES': 'EUR',
            'en-US': 'USD'
        };
        return currencies[lang] || 'EUR';
    },
    
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
        CurrencyConverter.updateLanguageSelector(lang);
        
        // Aplicar traduções primeiro
        if (window.GiroTranslations) {
            window.GiroTranslations.applyTranslations();
        }
        
        // Depois atualizar preços
        CurrencyConverter.updatePrices();
    },
    
    // Atualizar visual do seletor de idioma
    updateLanguageSelector: (lang) => {
        const options = document.querySelectorAll('.language-selector__option');
        
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
        const options = document.querySelectorAll('.language-selector__option');
        
        // Selecionar idioma ao clicar na bandeira
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = option.getAttribute('data-lang');
                CurrencyConverter.setLanguage(lang);
            });
        });
        
        // Inicializar com idioma atual
        const currentLang = CurrencyConverter.getCurrentLang();
        CurrencyConverter.updateLanguageSelector(currentLang);
        
        // Aplicar traduções iniciais
        if (window.GiroTranslations) {
            window.GiroTranslations.applyTranslations();
        }
    },
    
    // Converter valor de EUR para outra moeda
    convertFromEUR: (eurValue, targetCurrency) => {
        const rate = CurrencyConverter.exchangeRates[targetCurrency] || 1;
        return Math.round(eurValue * rate);
    },
    
    // Formatar valor monetário
    formatCurrency: (value, currency, lang) => {
        const locales = {
            'pt-PT': 'pt-PT',
            'pt-BR': 'pt-BR', 
            'es-ES': 'es-ES',
            'en-US': 'en-US'
        };
        
        return new Intl.NumberFormat(locales[lang] || 'pt-PT', {
            style: 'currency',
            currency: currency || 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    },
    
    // Atualizar símbolo da moeda
    updateCurrencySymbol: (currency) => {
        const symbols = {
            'EUR': '€',
            'BRL': 'R$',
            'USD': '$'
        };
        const currencyElements = document.querySelectorAll('.pricing-card__currency');
        currencyElements.forEach(el => {
            el.textContent = symbols[currency] || '€';
        });
    },
    
    // Atualizar valores em textos que contêm €
    updateTextWithEuro: (element, targetCurrency, currentLang) => {
        // Salvar texto original se ainda não foi salvo
        const originalText = element.getAttribute('data-original-text') || element.textContent;
        if (!element.getAttribute('data-original-text')) {
            element.setAttribute('data-original-text', originalText);
        }
        
        if (targetCurrency === 'EUR') {
            // Restaurar texto original para EUR
            element.textContent = originalText;
            return;
        }
        
        // Converter para outra moeda
        let newText = originalText;
        const euroMatches = originalText.matchAll(/€(\d+)/g);
        
        for (const match of euroMatches) {
            const euroValue = parseFloat(match[1]);
            const convertedValue = CurrencyConverter.convertFromEUR(euroValue, targetCurrency);
            const formatted = CurrencyConverter.formatCurrency(convertedValue, targetCurrency, currentLang);
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
        const currentLang = CurrencyConverter.getCurrentLang();
        const targetCurrency = CurrencyConverter.getCurrencyForLang(currentLang);
        const isBrazil = currentLang === 'pt-BR';
        
        // Atualizar símbolo da moeda
        CurrencyConverter.updateCurrencySymbol(targetCurrency);
        
        // Atualizar localização (IVA, métodos de pagamento)
        CurrencyConverter.updateLocalization(isBrazil);
        
        // Atualizar valores principais dos pacotes
        const priceAmounts = document.querySelectorAll('.pricing-card__amount[data-euro]');
        priceAmounts.forEach(element => {
            const euroValue = parseFloat(element.getAttribute('data-euro'));
            if (!isNaN(euroValue)) {
                if (targetCurrency !== 'EUR') {
                    const convertedValue = CurrencyConverter.convertFromEUR(euroValue, targetCurrency);
                    element.textContent = convertedValue;
                } else {
                    element.textContent = euroValue;
                }
            }
        });
        
        // Atualizar valores em textos de poupança
        const savingsElements = document.querySelectorAll('.pricing-card__savings');
        savingsElements.forEach(element => {
            CurrencyConverter.updateTextWithEuro(element, targetCurrency, currentLang);
        });
        
        // Atualizar preços dos serviços avulsos
        const individualServices = document.querySelectorAll('.individual-service li');
        individualServices.forEach(element => {
            CurrencyConverter.updateTextWithEuro(element, targetCurrency, currentLang);
        });
        
        // Atualizar preços dos cards de serviços
        const servicePrices = document.querySelectorAll('.service-card__price');
        servicePrices.forEach(element => {
            CurrencyConverter.updateTextWithEuro(element, targetCurrency, currentLang);
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

