const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1600;
canvas.height = 900;

// Telas do Menu
const menuInicial = document.getElementById('main-menu');
const menuCustom = document.getElementById('custom-menu');
const menuInstructions = document.getElementById('instructions-menu');

// Inputs de Nome
const inputNomeP1 = document.getElementById('p1-name-input');
const inputNomeP2 = document.getElementById('p2-name-input');

let nomeP1 = "JOGADOR 1";
let nomeP2 = "JOGADOR 2";

// Paletas de Cores
const paletaCoresP1 = ['#0088ff', '#00b4d8', '#7b2cbf', '#f72585', '#2b2d42', '#3a86ff', '#0077b6', '#d90429'];
const paletaCoresP2 = ['#ff6b35', '#ff9f1c', '#d00000', '#38b000', '#9d4edd', '#ff0055', '#e63946', '#8338ec'];

const paletaBoostP1 = ['#00ffff', '#7000ff', '#ff007f', '#00ff66', '#ffffff', '#00b4d8', '#f15bb5', '#fee440'];
const paletaBoostP2 = ['#ff9e00', '#ff0055', '#ccff00', '#00f5d4', '#ffffff', '#ff5400', '#9d4edd', '#70e000'];

let corCarroP1 = paletaCoresP1[0];
let corBoostP1 = paletaBoostP1[0];

let corCarroP2 = paletaCoresP2[0];
let corBoostP2 = paletaBoostP2[0];

let emJogo = false;
let golsAzul = 0;
let golsLaranja = 0;
let tempoRestante = 180;
let jogoAcabou = false;
let vencedor = '';

let emComemoracao = false;
let tempoComemoracao = 0;
let timeQueMarcou = '';
let particulasGol = [];
let particulasFumaca = [];

// Física
const GRAVIDADE = 0.28;
const CHAO_Y = canvas.height - 50;
const TETO_Y = 50;

// Web Audio
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function iniciarAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function tocarSomImpacto(frequencia, duracao) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequencia, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + duracao);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duracao);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duracao);
    } catch(e){}
}

function iniciarJogo() {
    iniciarAudio();
    nomeP1 = inputNomeP1.value.trim() !== '' ? inputNomeP1.value.trim().toUpperCase() : "JOGADOR 1";
    nomeP2 = inputNomeP2.value.trim() !== '' ? inputNomeP2.value.trim().toUpperCase() : "JOGADOR 2";

    menuInicial.classList.add('hidden');
    menuCustom.classList.add('hidden');
    menuInstructions.classList.add('hidden');
    emJogo = true;
    reiniciarPartidaCompleta();
}

function abrirPersonalizacao() {
    iniciarAudio();
    menuInicial.classList.add('hidden');
    menuCustom.classList.remove('hidden');
}

function abrirInstrucoes() {
    iniciarAudio();
    menuInicial.classList.add('hidden');
    menuInstructions.classList.remove('hidden');
}

function voltarMenu() {
    menuCustom.classList.add('hidden');
    menuInstructions.classList.add('hidden');
    menuInicial.classList.remove('hidden');
}

function criarSelecaoCores() {
    const contP1 = document.getElementById('colors-p1');
    if (contP1) {
        contP1.innerHTML = '';
        paletaCoresP1.forEach(cor => {
            const dot = document.createElement('div');
            dot.className = `color-dot ${cor === corCarroP1 ? 'selected' : ''}`;
            dot.style.backgroundColor = cor;
            dot.onclick = () => {
                corCarroP1 = cor;
                jogadorAzul.cor = cor;
                contP1.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                dot.classList.add('selected');
            };
            contP1.appendChild(dot);
        });
    }

    const contBoostP1 = document.getElementById('boost-colors-p1');
    if (contBoostP1) {
        contBoostP1.innerHTML = '';
        paletaBoostP1.forEach(cor => {
            const dot = document.createElement('div');
            dot.className = `boost-dot ${cor === corBoostP1 ? 'selected' : ''}`;
            dot.style.backgroundColor = cor;
            dot.onclick = () => {
                corBoostP1 = cor;
                jogadorAzul.corBoost = cor;
                contBoostP1.querySelectorAll('.boost-dot').forEach(d => d.classList.remove('selected'));
                dot.classList.add('selected');
            };
            contBoostP1.appendChild(dot);
        });
    }

    const contP2 = document.getElementById('colors-p2');
    if (contP2) {
        contP2.innerHTML = '';
        paletaCoresP2.forEach(cor => {
            const dot = document.createElement('div');
            dot.className = `color-dot ${cor === corCarroP2 ? 'selected' : ''}`;
            dot.style.backgroundColor = cor;
            dot.onclick = () => {
                corCarroP2 = cor;
                jogadorLaranja.cor = cor;
                contP2.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                dot.classList.add('selected');
            };
            contP2.appendChild(dot);
        });
    }

    const contBoostP2 = document.getElementById('boost-colors-p2');
    if (contBoostP2) {
        contBoostP2.innerHTML = '';
        paletaBoostP2.forEach(cor => {
            const dot = document.createElement('div');
            dot.className = `boost-dot ${cor === corBoostP2 ? 'selected' : ''}`;
            dot.style.backgroundColor = cor;
            dot.onclick = () => {
                corBoostP2 = cor;
                jogadorLaranja.corBoost = cor;
                contBoostP2.querySelectorAll('.boost-dot').forEach(d => d.classList.remove('selected'));
                dot.classList.add('selected');
            };
            contBoostP2.appendChild(dot);
        });
    }
}

setInterval(() => {
    if (emJogo && !jogoAcabou && !emComemoracao && tempoRestante > 0) {
        tempoRestante--;
        if (tempoRestante === 0) encerrarPartida();
    }
}, 1000);

const CAMPO = { largura: canvas.width, altura: canvas.height, golTamanhoY: 280 };
const teclas = {};

window.addEventListener('keydown', (e) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code) && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
    }
    teclas[e.key.toLowerCase()] = true;

    if (emJogo && !jogoAcabou && !emComemoracao) {
        if (e.key.toLowerCase() === jogadorAzul.controles.pulo) jogadorAzul.pular();
        if (e.key.toLowerCase() === jogadorLaranja.controles.pulo) jogadorLaranja.pular();
    }

    if (jogoAcabou && e.key.toLowerCase() === 'r') reiniciarPartidaCompleta();
    if (jogoAcabou && e.key.toLowerCase() === 'm') {
        emJogo = false;
        menuInicial.classList.remove('hidden');
    }
});

window.addEventListener('keyup', (e) => teclas[e.key.toLowerCase()] = false);

document.getElementById('btn-play')?.addEventListener('click', iniciarJogo);
document.getElementById('btn-custom')?.addEventListener('click', abrirPersonalizacao);
document.getElementById('btn-instructions')?.addEventListener('click', abrirInstrucoes);
document.getElementById('btn-back-custom')?.addEventListener('click', voltarMenu);
document.getElementById('btn-back-instructions')?.addEventListener('click', voltarMenu);

class ParticulaFumaca {
    constructor(x, y, cor, ehFumaca = true) {
        this.x = x;
        this.y = y;
        this.ehFumaca = ehFumaca;
        const angulo = Math.random() * Math.PI * 2;
        const vel = ehFumaca ? Math.random() * 1.5 + 0.5 : Math.random() * 4 + 1;
        this.vx = Math.cos(angulo) * vel;
        this.vy = Math.sin(angulo) * vel;
        this.tamanho = ehFumaca ? Math.random() * 8 + 4 : Math.random() * 4 + 2;
        this.opacidade = 1;
        this.cor = cor;
    }

    atualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.opacidade -= this.ehFumaca ? 0.02 : 0.03;
        if (this.ehFumaca) this.tamanho += 0.25;
    }

    desenhar() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.opacidade);
        ctx.fillStyle = this.cor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.tamanho, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function gerarEfeitoColisao(x, y, cor, quantidade = 10) {
    for (let i = 0; i < quantidade; i++) {
        particulasFumaca.push(new ParticulaFumaca(x, y, '#ffffff', true));
        particulasFumaca.push(new ParticulaFumaca(x, y, cor, false));
    }
}

function atualizarEDesenharParticulas() {
    for (let i = particulasFumaca.length - 1; i >= 0; i--) {
        const p = particulasFumaca[i];
        p.atualizar();
        p.desenhar();
        if (p.opacidade <= 0) particulasFumaca.splice(i, 1);
    }
}

class Carro {
    constructor(x, y, cor, corBoost, controles, direcaoOlhar = 1) {
        this.xInicial = x;
        this.yInicial = y;
        this.cor = cor;
        this.corBoost = corBoost;
        this.controles = controles;
        this.direcaoOlhar = direcaoOlhar;
        this.largura = 80;
        this.altura = 35;
        this.raioColisao = 38;
        this.vx = 0;
        this.vy = 0;
        this.angulo = 0;
        this.noChao = false;
        this.emRe = false;
        this.forcaPulo = 7.8;
        this.resetar();
    }

    resetar() {
        this.x = this.xInicial;
        this.y = this.yInicial;
        this.vx = 0;
        this.vy = 0;
        this.angulo = 0;
        this.noChao = false;
        this.emRe = false;
    }

    pular() {
        if (this.noChao) {
            this.vy = -this.forcaPulo;
            this.noChao = false;
            tocarSomImpacto(220, 0.1);
        }
    }

    atualizar() {
        if (!emJogo || jogoAcabou || emComemoracao) return;

        const c = this.controles;
        this.emRe = teclas[c.baixo];

        // Aceleracao aumentada (de 0.32 para 0.5)
        const acel = 0.5;

        if (this.noChao) {
            if (teclas[c.direita]) this.vx += acel;
            if (teclas[c.esquerda]) this.vx -= acel;
            if (this.emRe) {
                this.vx += (this.direcaoOlhar === 1) ? -acel : acel;
            }
        } else {
            if (teclas[c.esquerda]) this.angulo -= 0.08;
            if (teclas[c.direita]) this.angulo += 0.08;
        }

        if (teclas[c.boost]) {
            // Forca do boost aumentada (de 0.38 para 0.55)
            const forcaBoost = 0.55;
            let anguloEfetivo = this.angulo + (this.direcaoOlhar === -1 ? Math.PI : 0);
            
            if (this.emRe) {
                anguloEfetivo += Math.PI;
            }
            
            this.vx += Math.cos(anguloEfetivo) * forcaBoost;
            this.vy += Math.sin(anguloEfetivo) * forcaBoost;

            const pontoSaidaX = this.x - Math.cos(anguloEfetivo) * (this.largura / 2 + 10);
            const pontoSaidaY = this.y - Math.sin(anguloEfetivo) * (this.largura / 2 + 10);
            particulasFumaca.push(new ParticulaFumaca(pontoSaidaX, pontoSaidaY, this.corBoost, false));
        }

        this.vy += GRAVIDADE;
        this.vx *= 0.975;
        this.vy *= 0.98;

        this.x += this.vx;
        this.y += this.vy;

        const limiteEsquerdo = 30 + this.largura / 2;
        const limiteDireito = CAMPO.largura - 30 - this.largura / 2;

        if (this.x < limiteEsquerdo) {
            this.x = limiteEsquerdo;
            this.vx = 0;
        }
        if (this.x > limiteDireito) {
            this.x = limiteDireito;
            this.vx = 0;
        }

        if (this.y + this.altura / 2 >= CHAO_Y) {
            this.y = CHAO_Y - this.altura / 2;
            this.vy = 0;
            this.noChao = true;
            this.angulo = 0;
            this.vx *= 0.90;
        } else {
            this.noChao = false;
        }

        if (this.y - this.altura / 2 <= TETO_Y) {
            this.y = TETO_Y + this.altura / 2;
            this.vy = 0;
        }
    }

    desenhar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angulo);
        
        if (this.direcaoOlhar === -1) {
            ctx.scale(-1, 1);
        }

        ctx.fillStyle = this.cor;
        ctx.shadowColor = this.cor;
        ctx.shadowBlur = 10;
        ctx.fillRect(-this.largura / 2 + 8, this.altura / 2 - 3, this.largura - 16, 5);

        if (teclas[this.controles.boost] && emJogo && !jogoAcabou && !emComemoracao) {
            ctx.fillStyle = this.corBoost;
            ctx.shadowColor = this.corBoost;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            const posX = this.emRe ? (this.largura / 2 + 16) : (-this.largura / 2 - 16);
            ctx.arc(posX, 0, 14, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = this.cor;
        ctx.beginPath();
        ctx.roundRect(-this.largura / 2, -this.altura / 2, this.largura, this.altura, 8);
        ctx.fill();

        ctx.fillStyle = '#0a0f1d';
        ctx.beginPath();
        ctx.roundRect(-10, -this.altura / 2 + 4, 30, 14, 4);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.shadowBlur = 0;
        
        ctx.beginPath();
        ctx.arc(-this.largura / 2 + 18, this.altura / 2 + 2, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-this.largura / 2 + 18, this.altura / 2 + 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(this.largura / 2 - 20, this.altura / 2 + 2, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(this.largura / 2 - 20, this.altura / 2 + 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.fillRect(this.largura / 2 - 6, -6, 6, 8);

        ctx.restore();
    }
}

class Bola {
    constructor() {
        this.raio = 48;
        this.resetar();
    }

    resetar() {
        this.x = CAMPO.largura / 2;
        this.y = 250;
        this.vx = 0;
        this.vy = 0;
        this.rotacao = 0;
    }

    atualizar() {
        if (!emJogo || jogoAcabou || emComemoracao) return;

        this.vy += GRAVIDADE * 0.8;
        this.x += this.vx;
        this.y += this.vy;

        this.rotacao += this.vx * 0.02;
        this.vx *= 0.985;
        this.vy *= 0.985;

        const topoGol = CHAO_Y - CAMPO.golTamanhoY;

        if (this.y + this.raio > CHAO_Y) {
            this.y = CHAO_Y - this.raio;
            this.vy *= -0.65;
            this.vx *= 0.95;
        }

        if (this.y - this.raio < TETO_Y) {
            this.y = TETO_Y + this.raio;
            this.vy *= -0.65;
        }

        if (this.x - this.raio < 30) {
            if (this.y > topoGol) {
                golsLaranja++;
                iniciarComemoracao('LARANJA', 0, this.y);
            } else {
                this.x = 30 + this.raio;
                this.vx *= -0.7;
            }
        }

        if (this.x + this.raio > CAMPO.largura - 30) {
            if (this.y > topoGol) {
                golsAzul++;
                iniciarComemoracao('AZUL', CAMPO.largura, this.y);
            } else {
                this.x = CAMPO.largura - 30 - this.raio;
                this.vx *= -0.7;
            }
        }
    }

    desenhar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotacao);

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, this.raio, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 0;
        
        for (let i = 0; i < 5; i++) {
            const ang = (Math.PI * 2 / 5) * i;
            ctx.beginPath();
            ctx.arc(Math.cos(ang) * 20, Math.sin(ang) * 20, 12, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

const jogadorAzul = new Carro(250, CHAO_Y - 30, corCarroP1, corBoostP1, {
    pulo: 'w', baixo: 's', esquerda: 'a', direita: 'd', boost: ' '
}, 1);

const jogadorLaranja = new Carro(CAMPO.largura - 250, CHAO_Y - 30, corCarroP2, corBoostP2, {
    pulo: 'arrowup', baixo: 'arrowdown', esquerda: 'arrowleft', direita: 'arrowright', boost: 'enter'
}, -1);

const bola = new Bola();

function iniciarComemoracao(time, xGol, yGol) {
    emComemoracao = true;
    tempoComemoracao = 120;
    timeQueMarcou = time;
    particulasGol = [];
    const cor = time === 'AZUL' ? jogadorAzul.cor : jogadorLaranja.cor;
    tocarSomImpacto(280, 0.5);

    for (let i = 0; i < 70; i++) {
        particulasGol.push({
            x: xGol, y: yGol,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.5) * 14,
            tamanho: Math.random() * 8 + 3,
            cor: cor
        });
    }
}

function atualizarEComemorar() {
    if (!emComemoracao) return;
    tempoComemoracao--;
    particulasGol.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.tamanho *= 0.96;
    });

    if (tempoComemoracao <= 0) {
        emComemoracao = false;
        resetarPosicoes();
    }
}

function desenharComemoracao() {
    if (!emComemoracao) return;
    particulasGol.forEach(p => {
        ctx.fillStyle = p.cor;
        ctx.shadowColor = p.cor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.shadowBlur = 0;

    ctx.save();
    const nomeAutor = timeQueMarcou === 'AZUL' ? nomeP1 : nomeP2;
    const corTexto = timeQueMarcou === 'AZUL' ? jogadorAzul.cor : jogadorLaranja.cor;
    ctx.fillStyle = corTexto;
    ctx.shadowColor = corTexto;
    ctx.shadowBlur = 15;
    ctx.font = '900 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`GOL DE ${nomeAutor}!`, CAMPO.largura / 2, CAMPO.altura / 2);
    ctx.restore();
}

function resolverColisaoCarroBola(carro, bola) {
    if (emComemoracao) return;
    const dx = bola.x - carro.x;
    const dy = bola.y - carro.y;
    const dist = Math.hypot(dx, dy);
    const minDist = carro.raioColisao + bola.raio;

    if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;

        const sobreposicao = minDist - dist;
        bola.x += nx * sobreposicao;
        bola.y += ny * sobreposicao;

        const velRelativaX = carro.vx - bola.vx;
        const velRelativaY = carro.vy - bola.vy;
        const impulso = Math.hypot(velRelativaX, velRelativaY) + 3;

        bola.vx = nx * impulso * 1.1;
        bola.vy = ny * impulso * 1.1;

        carro.vx -= nx * 0.8;
        carro.vy -= ny * 0.8;

        gerarEfeitoColisao(bola.x, bola.y, '#ffffff', 8);
        tocarSomImpacto(170, 0.12);
    }
}

function resolverColisaoCarroCarro(c1, c2) {
    if (emComemoracao) return;
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dist = Math.hypot(dx, dy);
    const minDist = c1.raioColisao + c2.raioColisao;

    if (dist < minDist && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;

        const sobreposicao = minDist - dist;
        c1.x -= nx * (sobreposicao / 2);
        c1.y -= ny * (sobreposicao / 2);
        c2.x += nx * (sobreposicao / 2);
        c2.y += ny * (sobreposicao / 2);

        c1.vx *= -0.4;
        c1.vy *= -0.4;
        c2.vx *= -0.4;
        c2.vy *= -0.4;

        gerarEfeitoColisao((c1.x + c2.x) / 2, (c1.y + c2.y) / 2, '#ffaa00', 10);
        tocarSomImpacto(90, 0.2);
    }
}

function resetarPosicoes() {
    jogadorAzul.resetar();
    jogadorLaranja.resetar();
    bola.resetar();
}

function encerrarPartida() {
    jogoAcabou = true;
    if (golsAzul > golsLaranja) vencedor = nomeP1;
    else if (golsLaranja > golsAzul) vencedor = nomeP2;
    else vencedor = 'EMPATE';
}

function reiniciarPartidaCompleta() {
    golsAzul = 0;
    golsLaranja = 0;
    tempoRestante = 180;
    jogoAcabou = false;
    vencedor = '';
    resetarPosicoes();
}

function desenharCampo() {
    const grad = ctx.createLinearGradient(0, 0, 0, CAMPO.altura);
    grad.addColorStop(0, '#f1f5f9');
    grad.addColorStop(0.6, '#cbd5e1');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CAMPO.largura, CAMPO.altura);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CAMPO.largura; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, TETO_Y);
        ctx.lineTo(x, CHAO_Y);
        ctx.stroke();
    }

    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, CHAO_Y, CAMPO.largura, CAMPO.altura - CHAO_Y);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, CHAO_Y, CAMPO.largura, 4);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, CAMPO.largura, TETO_Y);

    const topoGol = CHAO_Y - CAMPO.golTamanhoY;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.fillRect(0, topoGol, 30, CAMPO.golTamanhoY);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, topoGol, 30, CAMPO.golTamanhoY);

    ctx.fillStyle = 'rgba(251, 146, 60, 0.25)';
    ctx.fillRect(CAMPO.largura - 30, topoGol, 30, CAMPO.golTamanhoY);
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 5;
    ctx.strokeRect(CAMPO.largura - 30, topoGol, 30, CAMPO.golTamanhoY);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(CAMPO.largura / 2, TETO_Y);
    ctx.lineTo(CAMPO.largura / 2, CHAO_Y);
    ctx.stroke();
    ctx.setLineDash([]);
}

function desenharHUD() {
    ctx.font = '900 38px Arial';
    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(CAMPO.largura / 2 - 200, 10, 400, 54);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.strokeRect(CAMPO.largura / 2 - 200, 10, 400, 54);

    // Placar
    ctx.fillStyle = jogadorAzul.cor;
    ctx.fillText(golsAzul, CAMPO.largura / 2 - 70, 50);

    ctx.fillStyle = jogadorLaranja.cor;
    ctx.fillText(golsLaranja, CAMPO.largura / 2 + 70, 50);

    // Cronômetro
    const m = Math.floor(tempoRestante / 60);
    const s = (tempoRestante % 60).toString().padStart(2, '0');
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(`${m}:${s}`, CAMPO.largura / 2, 44);

    // Nomes acima do Placar
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'right';
    ctx.fillStyle = jogadorAzul.cor;
    ctx.fillText(nomeP1, CAMPO.largura / 2 - 110, 43);

    ctx.textAlign = 'left';
    ctx.fillStyle = jogadorLaranja.cor;
    ctx.fillText(nomeP2, CAMPO.largura / 2 + 110, 43);

    if (jogoAcabou) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.fillRect(0, 0, CAMPO.largura, CAMPO.altura);
        ctx.textAlign = 'center';

        if (vencedor === 'EMPATE') {
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 55px Arial';
            ctx.fillText('EMPATE!', CAMPO.largura / 2, CAMPO.altura / 2 - 20);
        } else {
            const corVencedor = vencedor === nomeP1 ? jogadorAzul.cor : jogadorLaranja.cor;
            ctx.fillStyle = corVencedor;
            ctx.font = '900 58px Arial';
            ctx.fillText(`${vencedor} VENCEU!`, CAMPO.largura / 2, CAMPO.altura / 2 - 10);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 30px Arial';
            ctx.fillText(`PLACAR FINAL: ${golsAzul} x ${golsLaranja}`, CAMPO.largura / 2, CAMPO.altura / 2 + 45);
        }

        ctx.font = '20px Arial';
        ctx.fillStyle = '#475569';
        ctx.fillText('Pressione [R] para Rejogar | [M] Menu Principal', CAMPO.largura / 2, CAMPO.altura / 2 + 105);
    }
}

function loop() {
    ctx.clearRect(0, 0, CAMPO.largura, CAMPO.altura);

    if (emJogo) {
        desenharCampo();

        jogadorAzul.atualizar();
        jogadorLaranja.atualizar();
        bola.atualizar();

        atualizarEComemorar();

        resolverColisaoCarroBola(jogadorAzul, bola);
        resolverColisaoCarroBola(jogadorLaranja, bola);
        resolverColisaoCarroCarro(jogadorAzul, jogadorLaranja);

        jogadorAzul.desenhar();
        jogadorLaranja.desenhar();
        bola.desenhar();

        atualizarEDesenharParticulas();
        desenharComemoracao();
        desenharHUD();
    }

    requestAnimationFrame(loop);
}

criarSelecaoCores();
loop();