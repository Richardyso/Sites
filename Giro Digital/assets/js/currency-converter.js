// ===========================
// Giro Digital - Conversor de Moeda e Seletor de Idioma
// Usa preços manuais definidos no arquivo precos-moedas.json
// ===========================

const CurrencyConverter = {
    // Dados de preços carregados do JSON
    pricingData: null,
    
    // Idioma atual (será definido na inicialização)
    currentLang: 'pt-PT',
    
    // Carregar dados de preços do arquivo JSON
    loadPricingData: async () => {
        try {
            // Tentar diferentes caminhos possíveis
            const paths = [
                'assets/js/precos-moedas.json',
                '/assets/js/precos-moedas.json',
                './assets/js/precos-moedas.json'
            ];
            
            let response;
            for (const path of paths) {
                try {
                    response = await fetch(path);
                    if (response.ok) break;
                } catch (e) {
                    continue;
                }
            }
            
            if (!response || !response.ok) {
                throw new Error('Arquivo não encontrado');
            }
            
            CurrencyConverter.pricingData = await response.json();
            console.log('Dados de preços carregados:', CurrencyConverter.pricingData);
            return true;
        } catch (error) {
            console.error('Erro ao carregar arquivo de preços:', error);
            // Usar valores padrão se houver erro
            CurrencyConverter.pricingData = {
                moedas: {
                    'EUR': { simbolo: '€', nome: 'Euro' },
                    'BRL': { simbolo: 'R$', nome: 'Real' },
                    'USD': { simbolo: '$', nome: 'Dólar' }
                }
            };
            return false;
        }
    },
    
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
        
        // Depois atualizar preços com pequeno delay para garantir que DOM está atualizado
        setTimeout(() => {
            CurrencyConverter.updatePrices();
        }, 100);
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
    
    // Obter preço manual definido no JSON
    getManualPrice: (category, item, currency) => {
        if (!CurrencyConverter.pricingData) return null;
        
        try {
            if (category === 'pacotes') {
                return CurrencyConverter.pricingData.pacotes[item][currency];
            } else if (category === 'economia') {
                const [pacote] = item.split('_');
                return CurrencyConverter.pricingData.pacotes[pacote].economia[currency];
            } else if (category === 'servicos_cards') {
                return CurrencyConverter.pricingData.servicos_cards[item].preco_inicial[currency];
            } else if (category === 'servicos_avulsos') {
                const [tipo, servico] = item.split('_');
                return CurrencyConverter.pricingData.servicos_avulsos[tipo][servico][currency];
            }
        } catch (error) {
            console.error(`Preço não encontrado para: ${category}/${item}/${currency}`);
            return null;
        }
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
        const symbol = CurrencyConverter.pricingData?.moedas[currency]?.simbolo || '€';
        const currencyElements = document.querySelectorAll('.pricing-card__currency');
        currencyElements.forEach(el => {
            el.textContent = symbol;
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
    
    // Atualizar valores nos elementos
    updatePrices: async () => {
        // Garantir que os dados foram carregados
        if (!CurrencyConverter.pricingData) {
            await CurrencyConverter.loadPricingData();
        }
        
        const currentLang = CurrencyConverter.getCurrentLang();
        const targetCurrency = CurrencyConverter.getCurrencyForLang(currentLang);
        const isBrazil = currentLang === 'pt-BR';
        
        console.log('Atualizando preços:', { currentLang, targetCurrency, isBrazil });
        
        // Atualizar símbolo da moeda
        CurrencyConverter.updateCurrencySymbol(targetCurrency);
        
        // Atualizar localização (IVA, métodos de pagamento)
        CurrencyConverter.updateLocalization(isBrazil);
        
        // Atualizar valores principais dos pacotes
        const priceAmounts = document.querySelectorAll('.pricing-card__amount');
        priceAmounts.forEach(element => {
            const packageType = element.getAttribute('data-package');
            if (packageType) {
                const price = CurrencyConverter.getManualPrice('pacotes', packageType, targetCurrency);
                if (price !== null) {
                    element.textContent = price;
                }
            }
        });
        
        // Atualizar valores de economia
        const savingsElements = document.querySelectorAll('.pricing-card__savings');
        savingsElements.forEach(element => {
            const packageType = element.getAttribute('data-package-savings');
            if (packageType) {
                const economia = CurrencyConverter.getManualPrice('economia', packageType, targetCurrency);
                if (economia !== null) {
                    const symbol = CurrencyConverter.pricingData.moedas[targetCurrency].simbolo;
                    // Traduzir "Poupe" para português brasileiro
                    const saveText = isBrazil ? 'Economize' : 'Poupe';
                    element.textContent = `${saveText} ${symbol}${economia} vs. serviços avulsos`;
                }
            }
        });
        
        // Atualizar preços dos serviços avulsos com IDs específicos
        const serviceMappings = {
            'preco-logotipo': 'design_logotipo',
            'preco-cartao': 'design_cartao_visita',
            'preco-manual': 'design_manual_marca',
            'preco-landing': 'websites_landing_page',
            'preco-site5': 'websites_site_5_paginas',
            'preco-gestao': 'marketing_gestao_redes_mensal'
        };
        
        Object.entries(serviceMappings).forEach(([id, mapping]) => {
            const element = document.getElementById(id);
            if (element) {
                const price = CurrencyConverter.getManualPrice('servicos_avulsos', mapping, targetCurrency);
                if (price !== null) {
                    const symbol = CurrencyConverter.pricingData.moedas[targetCurrency].simbolo;
                    element.textContent = `${symbol}${price}`;
                }
            }
        });
        
        // Atualizar preços dos cards de serviços
        const serviceCardMappings = {
            'preco-branding': 'branding',
            'preco-redes': 'redes_sociais',
            'preco-websites': 'websites',
            'preco-pacotes': 'pacotes_completos'
        };
        
        Object.entries(serviceCardMappings).forEach(([id, service]) => {
            const element = document.getElementById(id);
            if (element) {
                const price = CurrencyConverter.getManualPrice('servicos_cards', service, targetCurrency);
                if (price !== null) {
                    const symbol = CurrencyConverter.pricingData.moedas[targetCurrency].simbolo;
                    // Traduzir "A partir de" para português brasileiro
                    const fromText = isBrazil ? 'A partir de' : 'A partir de';
                    element.textContent = `${fromText} ${symbol}${price}`;
                }
            }
        });
    },
    
    // Inicializar conversor
    init: async () => {
        // Carregar dados de preços primeiro
        await CurrencyConverter.loadPricingData();
        
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

