const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'Reserva-CBVN'; 
const collectionName = 'bookings';  
async function clearCollection() {
  let client;
  try {
    client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log('Conectado ao MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const result = await collection.deleteMany({});
    console.log(`${result.deletedCount} documentos foram removidos da coleção "${collectionName}"`);

  } catch (err) {
    console.error('Erro ao conectar ou limpar os dados:', err);
    if (err && err.cause) {
      console.error('Causa do erro:', err.cause);
    }
  } finally {
    if (client) {
      await client.close();
    }
  }
}


clearCollection();
