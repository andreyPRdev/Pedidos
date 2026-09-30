const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pedidos',
  password: 'casa67',
  port: 5432,
});


app.post('/clientes', async (req, res) => {
  try {
    const { nome, email } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ erro: 'nome e email são obrigatórios' });
    }

    const resultado = await pool.query(
      'INSERT INTO clientes (nome, email) VALUES ($1, $2) RETURNING *',
      [nome, email]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.log(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar cliente (email já existe?)' });
  }
});

app.get('/clientes', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM clientes');
    res.json(resultado.rows);
  } catch (erro) {
    console.log(erro);
    res.status(500).json({ erro: 'Erro ao listar clientes' });
  }
});

app.put('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;

    const resultado = await pool.query(
      'UPDATE clientes SET nome = $1, email = $2 WHERE id = $3 RETURNING *',
      [nome, email, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.log(erro);
    res.status(500).json({ erro: 'Erro ao atualizar cliente' });
  }
});

app.delete('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      'DELETE FROM clientes WHERE id = $1 RETURNING *',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    res.json({ mensagem: 'Cliente removido' });
  } catch (erro) {
    console.log(erro);
    res.status(400).json({ erro: 'Não foi possível deletar (cliente pode ter pedidos)' });
  }
});


app.get('/clientes/:id/pedidos', async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      'SELECT * FROM pedidos WHERE cliente_id = $1',
      [id]
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.log(erro);
    res.status(500).json({ erro: 'Erro ao buscar pedidos do cliente' });
  }
});


const statusValidos = ['pendente', 'preparando', 'entregue'];

app.post('/pedidos', async (req, res) => {
  try {
    const { produto, valor, status, cliente_id } = req.body;

    if (!produto || !valor || !cliente_id) {
      return res.status(400).json({ erro: 'produto, valor e cliente_id são obrigatórios' });
    }


    if (isNaN(Number(valor))) {
      return res.status(400).json({ erro: 'valor precisa ser um número' });
    }

  
    if (status && !statusValidos.includes(status)) {
      return res.status(400).json({ erro: 'status deve ser pendente, preparando ou entregue' });
    }

    const cliente = await pool.query(
      'SELECT * FROM clientes WHERE id = $1',
      [cliente_id]
    );
    if (cliente.rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não existe' });
    }

    const resultado = await pool.query(
      'INSERT INTO pedidos (produto, valor, status, cliente_id) VALUES ($1, $2, COALESCE($3, \'pendente\'), $4) RETURNING *',
      [produto, Number(valor), status, cliente_id]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.log(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar pedido' });
  }
});

app.get('/pedidos', async (req, res) => {
  try {
    const { status } = req.query;

    let resultado;
    if (status) {
      resultado = await pool.query(
        `SELECT pedidos.id, pedidos.produto, pedidos.valor, pedidos.status, clientes.nome AS cliente_nome
        FROM pedidos JOIN clientes ON pedidos.cliente_id = clientes.id WHERE pedidos.status = $1`,
        [status]
      );
    } else {
      resultado = await pool.query(
        `SELECT pedidos.id, pedidos.produto, pedidos.valor, pedidos.status, clientes.nome AS cliente_nome
         FROM pedidos JOIN clientes ON pedidos.cliente_id = clientes.id`
      );
    }

    res.json(resultado.rows);
  } catch (erro) {
    console.log(erro);
    res.status(500).json({ erro: 'Erro ao listar pedidos' });
  }
});

app.put('/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!statusValidos.includes(status)) {
      return res.status(400).json({ erro: 'status deve ser pendente, preparando ou entregue' });
    }

    const resultado = await pool.query(
      'UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Pedido não encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.log(erro);
    res.status(500).json({ erro: 'Erro ao atualizar pedido' });
  }
});

app.listen(3000, () => {
  console.log('Servidor tá rodano http://localhost:3000');
});