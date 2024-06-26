const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;

//middleware

app.use(cors({
    origin: [
        'http://localhost:5173', 'http://localhost:5174'
    ],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

console.log(process.env.DB_PASS, process.env.DB_USER)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qvnsypp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//middlewares
const logger = (req, res, next) => {
    console.log('logInfo', req.method, req.url)
    next()
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token
    // console.log('token in the middleware', token)
    //no token available
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCES_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next()
    })
    // next()
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const servicesCollection = client.db('CarsDoctors').collection('Services')
        const bookingCollection = client.db('CarsDoctors').collection('booking')

        //auth related /jwt api
        app.post('/jwt', async (req, res) => {
            const user = req.body
            console.log('token create with email', user)
            const token = jwt.sign(user, process.env.ACCES_TOKEN_SECRET, { expiresIn: '1h' })

            // res.send({token}) eta diye browser a console dekhat jonno korbe then follow under the res.send

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true })

        })

        //after user logout site then clear his token from browser application cookie
        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('token cookie clear', user)
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

        //service related api
        app.get('/service', async (req, res) => {
            const cursor = servicesCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: {
                    title: 1, price: 1, service_id: 1, img: 1
                }
            }
            const result = await servicesCollection.findOne(query, options)
            res.send(result)
        })

        //booking service
        //onno vabe email diye data get
        app.get('/bookings', logger, verifyToken, async (req, res) => {
            console.log(req.query.email)
            console.log('token owner info', req.user)
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbbiden access' })
            }
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray()
            res.send(result)
        })

        app.post('/bookings', async (req, res) => {
            const bookingCard = req.body
            console.log(bookingCard)
            const result = await bookingCollection.insertOne(bookingCard)
            res.send(result)
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query)
            res.send(result)
        })

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updatedBook = req.body;
            console.log(updatedBook)
            const updateDoc = {
                $set: {
                    status: updatedBook.status
                }
            };
            const result = await bookingCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('doctor is running')
})
app.listen(port, () => {
    console.log(`car server is running ${port}`)
})