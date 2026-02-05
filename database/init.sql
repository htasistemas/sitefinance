CREATE TABLE IF NOT EXISTS planos (
    id               SERIAL PRIMARY KEY,
    nome             VARCHAR(100) NOT NULL,
    tipo             VARCHAR(50)  NOT NULL,
    descricao        TEXT,
    valor_centavos   INTEGER      NOT NULL,
    ativo            BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracoes_mercadopago (
    id                          SERIAL PRIMARY KEY,
    public_key                  VARCHAR(255) NOT NULL,
    access_token                VARCHAR(255) NOT NULL,
    modo_sandbox                BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em                   TIMESTAMP    NOT NULL DEFAULT NOW(),
    atualizado_em               TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assinaturas (
    id                      SERIAL PRIMARY KEY,
    usuario_id              INTEGER      NOT NULL,
    plano_id                INTEGER      NOT NULL,
    status                  VARCHAR(50)  NOT NULL,
    meio_pagamento          VARCHAR(50)  NOT NULL,
    valor_centavos          INTEGER      NOT NULL,
    mercadopago_preference_id VARCHAR(255),
    mercadopago_payment_id  VARCHAR(255),
    data_inicio             TIMESTAMP,
    data_fim                TIMESTAMP,
    criado_em               TIMESTAMP    NOT NULL DEFAULT NOW(),
    atualizado_em           TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_assinatura_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_assinatura_plano   FOREIGN KEY (plano_id)   REFERENCES planos (id)
);

CREATE TABLE IF NOT EXISTS pagamentos_infinitepay (
    id               SERIAL PRIMARY KEY,
    order_nsu        VARCHAR(255) NOT NULL UNIQUE,
    transaction_nsu  VARCHAR(255),
    slug             VARCHAR(255),
    receipt_url      TEXT,
    plano_id         INTEGER NOT NULL,
    periodicidade    VARCHAR(50) NOT NULL,
    quantidade       INTEGER NOT NULL DEFAULT 1,
    valor_centavos   INTEGER NOT NULL,
    status           VARCHAR(20) NOT NULL,
    usuario_id       INTEGER,
    email            VARCHAR(255),
    payload          JSONB,
    criado_em        TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pagamento_infinitepay_plano FOREIGN KEY (plano_id) REFERENCES planos (id)
);
