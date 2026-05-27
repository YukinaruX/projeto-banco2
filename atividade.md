Projeto Final — Banco de Dados II
Disciplina: Banco de Dados II
Professora: Soraya Torres
1. Objetivo do Projeto
O objetivo deste projeto prático é desenvolver um banco de dados funcional e robusto utilizando a plataforma Supabase (PostgreSQL) para suportar um sistema de agendamentos. O projeto visa consolidar os conceitos avançados abordados ao longo do semestre, exigindo a implementação direta de regras de negócio na camada de dados.

Nota Tecnológica: O banco de dados deve ser projetado de forma autossuficiente. A arquitetura deve permitir que uma camada de frontend seja gerada posteriormente por ferramentas de Inteligência Artificial utilizando estritamente as credenciais, tabelas, views e funções expostas pelo Supabase.
2. Cenário do Sistema e Escopo
O sistema proposto gerenciará o fluxo de agendamentos de serviços prestados por profissionais a clientes, englobando:
Cadastro e identificação única de clientes.
Cadastro de profissionais com suas respectivas especialidades.
Catálogo de serviços oferecidos e seus valores monetários.
Fluxo completo de agendamentos com controle de data, hora e status de atendimento.
3. Requisitos de Implementação (Partes 1 a 6)
Parte 1 — Estrutura Básica do Banco
O script deverá prever a criação de, no mínimo, quatro tabelas fundamentais:
Clientes: Identificador único, nome completo e telefone de contato.
Profissionais: Identificador único, nome completo e especialidade médica ou técnica.
Serviços: Identificador único, nome do serviço e valor (preço).
Agendamentos: Vinculação entre cliente, profissional e serviço, contendo carimbo de data/hora e o status atual do atendimento.
Parte 2 — Relacionamentos e Constraints
Para assegurar a integridade referencial e a consistência dos dados, o modelo deve conter:
Chaves primárias (PK) bem definidas para todas as entidades.
Chaves estrangeiras (FK) mapeando corretamente os relacionamentos.
Campos obrigatórios (NOT NULL) onde a ausência de informação inviabilize o negócio.
Validações de consistência (CHECK constraints) para impedir valores de serviços negativos ou nulos e para restringir os status de agendamento a um domínio pré-definido (ex: 'Agendado', 'Confirmado', 'Cancelado', 'Realizado').
Parte 3 — Procedure Obrigatória: Realizar Agendamento
Componente central de manipulação de dados do projeto. A stored procedure deve receber os parâmetros do agendamento, invocar a função de validação de horário e, caso não haja conflitos ou duplicidades para o mesmo profissional no mesmo período, efetivar a inserção do registro.
Parte 4 — Function Obrigatória: Verificar Disponibilidade
Esta função desempenha o papel de validação lógica. Ela deve aceitar o identificador do profissional e o horizonte de data/hora proposto, retornando um valor booleano ou indicativo sobre a disponibilidade do bloco de tempo. Esta função deve ser obrigatoriamente consumida pela procedure descrita na Parte 3.
Parte 5 — View Obrigatória: Agenda Completa
Uma visão consolidada que realiza as junções necessárias para expor uma camada legível ao frontend. Deve unificar o nome do cliente, o profissional, o nome do serviço, o valor financeiro associado, a data/hora e o status do atendimento, abstraindo a complexidade dos IDs numéricos ou UUIDs.
Parte 6 — Trigger Obrigatória: Auditoria de Agendamentos
Mecanismo automático de rastreabilidade. Qualquer evento de inserção (INSERT) ou modificação (UPDATE) na tabela de agendamentos deve disparar um gatilho que grave um registro histórico em uma tabela secundária de auditoria, contendo a data do evento e o tipo de ação executada.
4. Validação e Entregáveis (Partes 7 e 8)
Parte 7 — Consultas SQL de Demonstração
O aluno deve incluir no script final consultas analíticas que comprovem a capacidade de extração de inteligência de negócio do banco. É mandatório o uso coordenado de cláusulas de junção (JOIN), filtragem avançada, ordenação (ORDER BY) e agrupamento (GROUP BY) combinados com funções agregadas (ex: contagem de agendamentos por profissional).
Parte 8 — Carga de Dados de Teste
O script deve conter comandos de inserção de dados fictícios em volume e variedade suficientes para testar todos os fluxos: cenários de sucesso na marcação, cenários de falha por bloqueio de horário na função/procedure, e a geração de linhas automáticas na tabela de auditoria.
5. Formato de Entrega
Os estudantes deverão submeter os seguintes itens através do portal acadêmico:
Script SQL Completo (.sql): Arquivo executável contendo toda a DDL (tabelas, chaves, views, triggers) e DML (functions, procedures, dados de teste e consultas).

Diagrama do Banco de Dados: Modelo de Entidade e Relacionamento (MER/DER) exportado em formato de imagem ou PDF, evidenciando a cardinalidade das chaves.

Evidências de Funcionamento: Documento complementar contendo capturas de tela (prints) que demonstrem a execução bem-sucedida da procedure de agendamento, a resposta da view e o comportamento automático do log de auditoria.

Link do Projeto Supabase: URL de acesso ao painel do projeto para eventual auditoria técnica do código rodando em ambiente cloud.
6. Critérios de Avaliação e Pontuação
A nota final do projeto será calculada com base na distribuição dos seguintes pesos:
Componente de Avaliação
Descrição Detalhada
Peso / Pontuação
 
Procedure
Lógica de agendamento e tratamento de exceções de horário.
3,0 pontos
Function
Modularidade e exatidão na checagem de janelas de tempo ocupadas.
2,0 pontos
Trigger
Automatização do processo de logs e integridade na tabela de auditoria.
2,0 pontos
View
Abstração correta de joins para simplificação do consumo pelo front.
1,5 pontos
Relacionamentos e Constraints
Configuração correta de PKs, FKs, campos obrigatórios e cláusulas CHECK.
1,0 ponto
Consultas SQL
Uso correto de agregação, junções e agrupamentos para geração de relatórios.
0,5 ponto
Total Máximo
Cumprimento integral de todos os requisitos do roteiro.
10,0 pontos


