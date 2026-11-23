CREATE DATABASE IF NOT EXISTS mmvl_telecon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mmvl_telecon;

-- Em desenvolvimento, `npm run db:init` gera estas tabelas automaticamente via Sequelize.
-- Este arquivo documenta a estrutura relacional esperada para o banco em nuvem.
CREATE TABLE IF NOT EXISTS Users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(160) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS Producers (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(160) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS Products (
    id CHAR(36) PRIMARY KEY,
    category ENUM('CABLING','CERTIFICACAO','INFRAESTRUTURA','TELEFONIA') NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    detail VARCHAR(160) NOT NULL,
    ncm VARCHAR(30),
    unit_value DECIMAL(12,2) NOT NULL,
    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    producer_id CHAR(36),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (producer_id) REFERENCES Producers(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS Budgets (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    status ENUM('DRAFT','FINALIZED') DEFAULT 'FINALIZED',
    total_value DECIMAL(12,2) DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS BudgetItems (
    id CHAR(36) PRIMARY KEY,
    budget_id CHAR(36) NOT NULL,
    category VARCHAR(30) NOT NULL,
    product_id CHAR(36) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    unit_value DECIMAL(12,2) NOT NULL,
    markup_percentage DECIMAL(5,2) DEFAULT 0,
    total_value DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (budget_id) REFERENCES Budgets(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS RegistrationInvites (
    id CHAR(36) PRIMARY KEY,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
