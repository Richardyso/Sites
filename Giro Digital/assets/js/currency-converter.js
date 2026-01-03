// ===========================
// Giro Digital - Conversor de Moeda Simplificado
// Conversão automática baseada em taxas fixas
// ===========================

const CurrencyConverter = {
    // Taxas de conversão fixas (base EUR)
    exchangeRates: {
        'EUR': 1,
        'BRL': 6.4,  // 1 EUR = 6.4 BRL
        'USD': 1.04  // 1 EUR = 1.04 USD
    },
    
    // Preços base em EUR
    basePrices: {
        starter: 49.90,
        crescimento: 99,
        starter_economia: 14,
        crescimento_economia: 50,
        // Serviços avulsos
        logotipo: 10,
        cartao_visita: 3.50,
        manual_marca: 25,
        landing_page: 25,
        site_5_paginas: 50,
        // Cards de serviços
        branding_inicial: 38.50,
        websites_inicial: 25,
        pacotes_inicial: 49.90
    },
    
    // Idioma atual
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
    
    // Obter símbolo da moeda
    getCurrencySymbol: (currency) => {
        const symbols = {
            'EUR': '€',
            'BRL': 'R$',
            'USD': '$'
        };
        return symbols[currency] || '€';
    },
    
    // Converter valor de EUR para outra moeda
    convertPrice: (priceInEUR, targetCurrency) => {
        const rate = CurrencyConverter.exchangeRates[targetCurrency] || 1;
        return Math.round(priceInEUR * rate);
    },
    
    // Detectar se é Brasil
    isBrazil: () => {
        const savedLang = localStorage.getItem('giro-language');
        if (savedLang) {
            return savedLang.toLowerCase() === 'pt-br';
        }
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
        
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = option.getAttribute('data-lang');
                CurrencyConverter.setLanguage(lang);
            });
        });
        
        const currentLang = CurrencyConverter.getCurrentLang();
        CurrencyConverter.updateLanguageSelector(currentLang);
        
        if (window.GiroTranslations) {
            window.GiroTranslations.applyTranslations();
        }
    },
    
    // Formatar valor monetário
    formatPrice: (value, currency) => {
        if (currency === 'EUR') {
            return value.toFixed(2).replace('.', ',');
        }
        return value.toString();
    },
    
    // Atualizar símbolo da moeda
    updateCurrencySymbol: (currency) => {
        const symbol = CurrencyConverter.getCurrencySymbol(currency);
        const currencyElements = document.querySelectorAll('.pricing-card__currency');
        currencyElements.forEach(el => {
            el.textContent = symbol;
        });
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
                mbwayPayment.style.display = 'none';
                pixPayment.style.display = 'flex';
            } else {
                mbwayPayment.style.display = 'flex';
                pixPayment.style.display = 'none';
            }
        }
    },
    
    // Atualizar valores nos elementos
    updatePrices: () => {
        const currentLang = CurrencyConverter.getCurrentLang();
        const targetCurrency = CurrencyConverter.getCurrencyForLang(currentLang);
        const isBrazil = currentLang === 'pt-BR';
        const symbol = CurrencyConverter.getCurrencySymbol(targetCurrency);
        
        // Atualizar símbolo da moeda
        CurrencyConverter.updateCurrencySymbol(targetCurrency);
        
        // Atualizar localização
        CurrencyConverter.updateLocalization(isBrazil);
        
        // Atualizar valores dos pacotes
        const priceAmounts = document.querySelectorAll('.pricing-card__amount');
        priceAmounts.forEach(element => {
            const packageType = element.getAttribute('data-package');
            if (packageType && CurrencyConverter.basePrices[packageType]) {
                const basePrice = CurrencyConverter.basePrices[packageType];
                const convertedPrice = CurrencyConverter.convertPrice(basePrice, targetCurrency);
                
                if (targetCurrency === 'EUR') {
                    element.textContent = CurrencyConverter.formatPrice(basePrice, targetCurrency);
                } else {
                    element.textContent = convertedPrice;
                }
            }
        });
        
        // Atualizar valores de economia
        const savingsElements = document.querySelectorAll('.pricing-card__savings');
        savingsElements.forEach(element => {
            const packageType = element.getAttribute('data-package-savings');
            if (packageType) {
                const economiaKey = packageType + '_economia';
                if (CurrencyConverter.basePrices[economiaKey]) {
                    const baseEconomia = CurrencyConverter.basePrices[economiaKey];
                    const convertedEconomia = CurrencyConverter.convertPrice(baseEconomia, targetCurrency);
                    const saveText = isBrazil ? 'Economize' : 'Poupe';
                    element.textContent = `${saveText} ${symbol}${convertedEconomia} vs. serviços avulsos`;
                }
            }
        });
        
        // Atualizar preços dos serviços avulsos
        const serviceIds = {
            'preco-logotipo': 'logotipo',
            'preco-cartao': 'cartao_visita',
            'preco-manual': 'manual_marca',
            'preco-landing': 'landing_page',
            'preco-site5': 'site_5_paginas'
        };
        
        Object.entries(serviceIds).forEach(([id, priceKey]) => {
            const element = document.getElementById(id);
            if (element && CurrencyConverter.basePrices[priceKey]) {
                const basePrice = CurrencyConverter.basePrices[priceKey];
                const convertedPrice = CurrencyConverter.convertPrice(basePrice, targetCurrency);
                
                if (targetCurrency === 'EUR') {
                    element.textContent = `${symbol}${CurrencyConverter.formatPrice(basePrice, targetCurrency)}`;
                } else {
                    element.textContent = `${symbol}${convertedPrice}`;
                }
            }
        });
        
        // Atualizar preços dos cards de serviços
        const serviceCardIds = {
            'preco-branding': 'branding_inicial',
            'preco-websites': 'websites_inicial',
            'preco-pacotes': 'pacotes_inicial'
        };
        
        Object.entries(serviceCardIds).forEach(([id, priceKey]) => {
            const element = document.getElementById(id);
            if (element && CurrencyConverter.basePrices[priceKey]) {
                const basePrice = CurrencyConverter.basePrices[priceKey];
                const convertedPrice = CurrencyConverter.convertPrice(basePrice, targetCurrency);
                const fromText = 'A partir de';
                
                if (targetCurrency === 'EUR') {
                    element.textContent = `${fromText} ${symbol}${CurrencyConverter.formatPrice(basePrice, targetCurrency)}`;
                } else {
                    element.textContent = `${fromText} ${symbol}${convertedPrice}`;
                }
            }
        });
    },
    
    // Inicializar conversor
    init: () => {
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