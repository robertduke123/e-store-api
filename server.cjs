require("dotenv").config();
const express = require("express");
const bodyparser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");

const app = express();
app.use(bodyparser.json());
app.use(cors());

const db = knex({
	client: "pg",
	connection: {
		host: process.env.RENDER_HOST,
		port: 5432,
		user: process.env.RENDER_USER,
		password: process.env.RENDER_PASSWORD,
		database: process.env.RENDER_DATABASE,
	},
});

app.get("/", (req, res) => {
	res.json("it is working!");
});

app.post("/signin", (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		res.status(400).json("incorrect form submission");
	}
	db.select("email", "hash")
		.from("login")
		.where("email", "=", email)
		.then((data) => {
			const isValid = bcrypt.compareSync(password, data[0].hash);
			if (isValid) {
				return db
					.select("*")
					.from("users")
					.where("email", "=", email)
					.then((user) => {
						res.json(user[0]);
					})
					.catch((err) => res.status(400).json("unable to get user"));
			} else {
				res.status(400).json("wrong cridentials");
			}
		})
		.catch((err) => res.status(400).json("wrong cridentials"));
});

app.post("/register", (req, res) => {
	const { firstName, lastName, email, phone, address, city, zip, password } =
		req.body;
	if (!email || !firstName || !lastName || !password) {
		res.status(400).json("incorrect form submission");
	}
	const hash = bcrypt.hashSync(password);
	db.transaction((trx) => {
		trx
			.insert({
				hash: hash,
				email: email,
			})
			.into("login")
			.returning("email")
			.then((loginEmail) => {
				return trx("users")
					.returning("*")
					.insert({
						first_name: firstName,
						last_name: lastName,
						phone: phone,
						email: loginEmail[0].email,
						address: address,
						city: city,
						zip: zip,
					})
					.then((user) => {
						res.json(user[0]);
					});
			})
			.then(trx.commit)
			.catch(trx.rollback);
	}).catch((err) => res.status(400).json("unable to register"));
});

app.put("/edit_user", (req, res) => {
	const {
		id,
		newFirst,
		newLast,
		newEmail,
		newPhone,
		newAddress,
		newCity,
		newZip,
	} = req.body;
	db("login")
		.where("id", "=", id)
		.update({
			email: newEmail,
		})
		.returning("*")
		.then((data) => {
			return db("users")
				.where("id", "=", id)
				.update({
					first_name: newFirst,
					last_name: newLast,
					phone: newPhone,
					email: newEmail,
					address: newAddress,
					city: newCity,
					zip: newZip,
				})
				.returning("*")
				.then((data) => res.json(data[0]));
		});
});

app.put("/edit_password", (req, res) => {
	const { id, oldPassword, newPassword } = req.body;
	db.select("*")
		.from("login")
		.where("id", "=", id)
		.then((data) => {
			const isValid = bcrypt.compareSync(oldPassword, data[0].hash);
			if (isValid) {
				const hash = bcrypt.hashSync(newPassword);
				db("login")
					.where("id", "=", id)
					.update({
						hash: hash,
					})
					.then(res.json("change password successful"));
			}
		});
});

app.put("/reviews", (req, res) => {
	const { product_id, stars, review } = req.body;
	db.select("*")
		.from("reviews")
		.then((data) => {
			console.log(data);
			let count = 0;
			data.forEach((row) => {
				if (row.product_id === product_id) {
					db.select("*")
						.from("reviews")
						.where({ product_id: product_id })
						.update({
							star_one: [...row.star_one, stars[0]],
							star_two: [...row.star_two, stars[1]],
							star_three: [...row.star_three, stars[2]],
							star_four: [...row.star_four, stars[3]],
							star_five: [...row.star_five, stars[4]],
							review_text: [...row.review_text, review],
						})
						.returning("*")
						.then((data) => res.json(data[0]));
				} else {
					count++;
				}
			});
			if (count === 1 || data.length === 0) {
				db.insert({
					product_id: product_id,
					star_one: [stars[0]],
					star_two: [stars[1]],
					star_three: [stars[2]],
					star_four: [stars[3]],
					star_five: [stars[4]],
					review_text: [review],
				})
					.into("reviews")
					.returning("*")
					.then((data) => res.json(data[0]));
			}
			count = 0;
		});
});

app.get("/get_reviews", (req, res) => {
	db.select("*")
		.from("reviews")
		.then((data) => res.json(data))
		.catch((err) => res.status(400).json("no reviews found"));
});

app.listen(3000, () => {
	console.log("app is running");
});
