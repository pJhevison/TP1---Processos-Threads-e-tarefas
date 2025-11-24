# 🖥️ Simulador de Estados de Processos — SO

O **Simulador de Estados de Processos** é uma ferramenta desenvolvida em **HTML, CSS e JavaScript** para auxiliar no entendimento do ciclo de vida de um processo em um Sistema Operacional.  
Ela permite visualizar, de forma clara e interativa, como um processo transita entre os estados clássicos: **Novo**, **Pronto**, **Execução**, **Bloqueado** e **Finalizado**.

---

## 📖 Sobre a Ferramenta

A interface apresenta **cinco colunas**, cada uma representando um estado possível de um processo.  
Cada processo aparece como um *card* com informações como:

- ID do processo  
- Nome  
- Estado atual  

O usuário pode interagir com botões que simulam operações típicas do SO, como colocar um processo em execução, bloquear, finalizar, criar novos processos, entre outros.

Cada ação atualiza o estado internamente e reposiciona automaticamente o card na coluna correspondente.

---

## 🎯 Funcionalidades

- ✔ Criar novos processos  
- ✔ Colocar um processo em **Execução**  
- ✔ Enviar o processo para o estado **Pronto**  
- ✔ Bloquear processos (estado **Bloqueado**)  
- ✔ Finalizar processos  
- ✔ Interface dinâmica totalmente atualizada pelo JavaScript  
- ✔ Organização automática dos processos por estado  
- ✔ Visualização limpa e intuitiva de todos os estados simultaneamente  

---

## 🛠 Tecnologias Utilizadas

- **HTML5** → estrutura da interface  
- **CSS3** → estilização e layout  
- **JavaScript** → controle de estados e lógica da aplicação
/simulador-processos
│── index.html
│── style.css
│── script.js
│── README.md

---

## ▶ Como Executar

Não precisa instalar nada!  
Basta abrir o arquivo:


ou usar o **Live Server** no VS Code:

1. Clique com o botão direito no `index.html`  
2. Selecione **Open with Live Server**

---
