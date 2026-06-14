CREATE DATABASE IF NOT EXISTS senac_pi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE senac_pi;

CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  senha      VARCHAR(255)  NOT NULL,
  perfil     ENUM('aluno','coordenador','admin') NOT NULL,
  criado_em  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificados (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT          NOT NULL,
  nome        VARCHAR(200) NOT NULL,
  categoria   VARCHAR(50)  NOT NULL,
  horas       INT          NOT NULL,
  descricao   TEXT,
  arquivo     VARCHAR(255) NOT NULL,
  status      ENUM('pendente','aprovado','reprovado') DEFAULT 'pendente',
  observacao  TEXT,
  criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

INSERT IGNORE INTO usuarios (nome, email, senha, perfil) VALUES
  ('Admin',       'admin@senac.br',       'admin123', 'admin'),
  ('Coordenador', 'coordenador@senac.br', 'coord123', 'coordenador'),
  ('Aluno Teste', 'aluno@senac.br',       'senac123', 'aluno');
