const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

app.get('/', function (req, res) {
  res.send('Hello World');
});

app.get('/api/items', function (req, res) {
  const q = req.query?.q;
  const limit = req.query?.limit || 10;

  const url = `https://api.mercadolibre.com/sites/MLA/search?q=${q}&limit=${limit}`;

  fetch(url, { method: 'GET' })
    .then((res) => res.json())
    .then((apiRes) => {
      const { results, paging } = apiRes;

      const categories = [...new Set(results.map((item) => item.category_id))];

      const items = results.map((item) => ({
        id: item.id,
        title: item.title,
        price: {
          currency: item.currency_id,
          amount: item.price,
          decimals: 3,
        },
        picture: item.thumbnail,
        condition: item.condition,
        free_shipping: item.shipping.free_shipping,
      }));

      res.send({
        author: {
          name: 'Roberto',
          lastName: 'Zapata',
        },
        categories,
        items,
        paging,
      });
    })
    .catch((err) => console.log('error', err));
});

app.get('/api/items/:id', function (req, res) {
  const id = req.params.id.trim();

  const urlItem = `https://api.mercadolibre.com/items/${id}`;
  const urlDescription = `https://api.mercadolibre.com/items/${id}/description`;

  Promise.allSettled([
    fetch(urlItem, { method: 'GET' }),
    fetch(urlDescription, { method: 'GET' }),
  ]).then(async (values) => {
    const item = {};

    const [
      { value: itemValue, status: fistPromiseStatus },
      { value: itemDescription, status: secondPromiseStatus },
    ] = values;

    if (fistPromiseStatus === 'fulfilled') {
      const itemData = await itemValue.json();

      item.id = itemData.id;
      item.title = itemData.title;
      item.price = {
        currency: itemData.currency_id,
        amount: itemData.price,
        decimals: 3,
      };
      item.picture = itemData.thumbnail;
      item.condition = itemData.condition;
      item.free_shipping = itemData.free_shipping;
      item.sold_quantity = itemData.sold_quantity;
    }

    if (secondPromiseStatus === 'fulfilled') {
      const itemDes = await itemDescription.json();

      item.description = itemDes.plain_text;
    }

    res.send({
      author: {
        name: 'Roberto',
        lastName: 'Zapata',
      },
      item,
    });
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
