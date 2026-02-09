const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('layout', { title: 'Home Page' }); // Renders views/index.ejs
});