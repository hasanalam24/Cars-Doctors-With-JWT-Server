/*
1. jwt--> json web token install
2. generate a token by using jwt.sign (node enter .. then type require('crypto').randomBytes(64).toString('hex))
3. create an api set to cookie . httpOnly:true,secure:true,sameSite 'none'
4.form clien side: axios withCredentials: true
5. cors setup origin and credentials: true
*/

/*
1.for secure api calls
2.server side: install cookie parser and use it as a middleware
3.req.cookies
4. client side: make api call using axios withCredentials: true 

*/