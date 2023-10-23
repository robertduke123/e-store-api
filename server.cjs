const express = require('express')
const bodyparser = require('body-parser')
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')
const knex = require('knex')

const app = express()
app.use(bodyparser.json())
app.use(cors())

const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: 'Wiggles123',
    database: 'e-store'
  }
});


app.get('/', (req,res) => {
    res.json('it is working!')
})


app.post('/signin', (req, res) => {
    const {email, password} = req.body
    if(!email || !password) {
        res.status(400).json('incorrect form submission')
    }
    db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash)
        if(isValid) {
            return db.select('*').from('users')
            .where('email', '=', email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else {
            res.status(400).json('wrong cridentials')
        }        
    })
    .catch(err =>  res.status(400).json('wrong cridentials'))
})

app.post('/register', (req, res) => {
    const {firstName, lastName, email, phone, address, city, zip, password} = req.body
    if(!email || !firstName || !lastName || !password) {
        res.status(400).json('incorrect form submission')
    }
    const hash = bcrypt.hashSync(password)
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
                .returning('*')
                .insert({
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    email: loginEmail[0].email,
                    address: address,
                    city: city,
                    zip: zip
                })
                .then(user => {
                    res.json(user[0])
                })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))
})

app.put('/edit_user', (req, res) => {
    const {id, newFirst, newLast, newEmail, newPhone, newAddress, newCity, newZip} = req.body
    db('login').where('id', '=', id)
    .update({
        email: newEmail
    })
    .returning('*')
    .then(data => {
        return db('users').where('id', '=', id)
        .update({
            first_name: newFirst,
            last_name: newLast,
            phone: newPhone,
            email: newEmail,
            address: newAddress,    
            city: newCity,
            zip: newZip
        })
        .returning('*')
        .then(data => res.json(data[0]))
    })
})

app.put('/edit_password', (req, res) => {
    const {id, oldPassword, newPassword} = req.body
    db.select('*').from('login').where('id', '=', id)
    .then(data => {
        const isValid = bcrypt.compareSync(oldPassword, data[0].hash)
        if(isValid) {
            const hash = bcrypt.hashSync(newPassword)
            db('login').where('id', '=', id)
                .update({
                    hash: hash
                })
                .then(res.json('change password successful'))
        }
    })
})

app.put('/reviews', (req, res) => {
    const {product_id, stars, review} = req.body
    db.select('*').from('reviews')
    .then(data => {
        let count = 0
        data.forEach((row) => {
            if(row.product_id === product_id){
                count ++
                db.select('*').from('reviews').where({id: id})
                .update({
                    starOne: [...row.starOne, stars[0]],                
                    starTwo: [...row.starTwo, stars[1]],                
                    starThree: [...row.starThree, stars[2]],
                    starFour: [...row.starFour, stars[3]],
                    starFive: [...row.starFive, stars[4]],
                    text: [...row.text, review]
                }).returning('*')
                .then(data => res.json(data[0]))
            } else if(count = 1){
                db.insert({
                    product_id: product_id,
                    starOne: [stars[0]],                
                    starTwo: [stars[1]],                
                    starThree: [stars[2]],
                    starFour: [stars[3]],
                    starFive: [stars[4]],
                    text: [...row.text, review]
                }).into('reviews')
                .returning('*')
                .then(data => res.json(data[0]))
            }
            count = 0
        })
    })
})

app.get('/items', (req, res) => {
    res.json(db.items[0])
})

app.put('/add_items', (req, res) => {
    const { item } = req.body

    db.items.push(item)
    res.json(db.items)
})

app.listen(3000, () => {
    console.log('app is running')
})