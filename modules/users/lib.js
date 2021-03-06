'use strict';

var Promise = require('promise'),
	client = require('mongodb').MongoClient,
	bcrypt = require('bcrypt'),
	config = require('./../../lib/config')('/modules/users/config.json'),
	User = require('./model');

/**
 * Sign a new user up
 * @param {String} email
 * @param {String} password
 * @return {Promise}
 */
function signup(email, password){
	return new Promise(function(resolve, reject){
		if (!email || !password){
			// TODO: should be an ArgumentError
			reject(new Error('E-mail or password not provided'));
			return;
		}

		// TODO: make this check a tad more robust
		if (!/[^@]+@[^.]+(.[^.]+)+/.test(email)){
			reject(new Error('Email not valid'));
			return;
		}

		client.connect(config.db, function(err, db){
			if (err){
				console.log('Failed to connect to MongoDB');
				reject(new Error('Failed to connect to MongoDB'));
				return;
			}

			var collection = db.collection('user');
			collection.findOne({email: email}, function(err, doc){
				if (err){
					db.close();
					reject(new Error('Failed to query collection'));
					return;
				}

				if (doc){
					db.close();
					reject(new Error('E-mail is already registered'));
					return;
				}

				bcrypt.hash(password, 10, function(err, hash){
					if (err){
						db.close();
						reject(new Error('Failed to hash password'));
						return;
					}

					var data = {
						email: email,
						password: hash
					};
					collection.insert(data, function(err){
						db.close();
						if (err){
							reject(new Error('Failed to insert data into MongoDB'));
							return;
						}
						resolve(data);
					});
				});
			});
		});
	});
}

/**
 * Log a user in
 * @param {String} email
 * @param {String} password
 * @return {Promise}
 */
function login(email, password){
	return new Promise(function(resolve, reject){
		if (!email || !password){
			// TODO: should be an ArgumentError
			reject(new Error('E-mail or password not provided'));
			return;
		}

		client.connect(config.db, function(err, db){
			if (err){
				console.log('Failed to connect to MongoDB');
				reject(new Error('Failed to connect to MongoDB'));
				return;
			}

			var collection = db.collection('user');
			collection.findOne({email: email}, function(err, doc){
				db.close();
				if (err){
					reject(new Error('Failed to query collection'));
					return;
				}

				if (!doc){
					reject(new Error('Could not find user with that email'));
					return;
				}

				bcrypt.compare(password, doc.password, function(err, equal){
					if (err){
						reject(new Error('Failed to do bcrypt compare'));
						return;
					}

					if (!equal){
						reject(new Error('Incorrect password'));
						return;
					}

					resolve(new User(doc));
				});
			});
		});
	});
}

module.exports = {
	signup: signup,
	login: login
};

