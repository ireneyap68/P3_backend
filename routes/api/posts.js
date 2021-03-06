require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const JWT_SECRET = process.env.JWT_SECRET;

const db = require("../../models");

router.get('/', (req,res) => {
    //console.log(req.query.filter)
    if(req.query.filter){
        let f = req.query.filter.split(',')
        console.log(f)
        db.Post.find({'tags':{$in:f}}).populate({path:'author',select:'name'}).sort('-date')
        .then(foundPost => {
            // console.log(foundPost)
            res.send(foundPost)
        })
        .catch(err=>{
            console.log(err)
            res.status.apply(503).send({message: 'Database asleep?'})
        })

    } else {

        db.Post.find().populate({path:'author',select:'name'}).populate({path:"comments.author", select:"name"}).sort('-date')
        .then(foundPost => {
            // console.log(foundPost)
            res.send(foundPost)
        })
        .catch(err=>{
            console.log(err)
            res.status.apply(503).send({message: 'Database asleep?'})
        })
    }
})

// router.post("/", passport.authenticate('jwt', { session: false }), (req,res) => 
router.post("/", (req,res) => 
{   
    db.Post.create(req.body)
    .then(createdPost => {
        // console.log(createdPost)
        res.status(201).send(createdPost)
    })
    .catch(err => {
        console.log('Error while creating new post', err)
        if(err.name === 'Valication Error'){
            res.status(406).send({message: 'Validation Error'})
        } else {
            res.status(503).send({message: "Database or server error!"})
        }
    })
})



router.put('/:id/comments/edit', (req,res)=>
{
   
    db.Post.findOneAndUpdate(
    {
        _id: req.params.id,
        comments:{$elemMatch:{_id:req.body.referencedComment}}
    }, 
    {
        $set: 
        { 
            "comments.$.descriptionsAndCode": req.body.descriptionsAndCode,
            "comments.$.imgUrl": req.body.imgUrl
        }
    })
    .then(editedComment => {
        res.send(editedComment)
        console.log(editedComment)
    })
    .catch(err => {
        console.log(err)
        res.status(503).send({message: 'server error'})
    })
    
})

//edit comment status
router.put('/:id/comments/editStatus', (req,res)=>
{
   
    db.Post.findOneAndUpdate(
    {
        _id: req.params.id,
        comments:{$elemMatch:{_id:req.body.comment}}
    }, 
    {
        $set: 
        { 
            "comments.$.starredOnPost": req.body.starredOnPost
        }
    })
    .then(editedComment => {
        res.send(editedComment)
        console.log(editedComment)
    })
    .catch(err => {
        console.log(err)
        res.status(503).send({message: 'server error'})
    })
    
})

// adding comments
router.put('/:id/comments', (req,res)=>
{
    db.Post.findOneAndUpdate({
        _id:req.params.id
    }, 
    {$push:
        {
            comments: {
            descriptionsAndCode: req.body.descriptionsAndCode, 
            author: req.body.author,
            imgUrl: req.body.imgUrl
            }
        }       
    },   
    {
        new: true
    })
    .then(updatedPost => {
        res.send(updatedPost)
        console.log(updatedPost)
    })
    .catch(err => {
        console.log(err)
        res.status(503).send({message: 'server error'})
    })
})




// deleting comments
router.put('/:id/comments/delete', (req,res)=>
{
    db.Post.findOneAndUpdate({
        _id:req.params.id
    }, 
    {$pull:
        {
            comments: {
                _id: req.body.id
            }
        }
    },   
    {
        new: true
    })
    .then(deletedcomment => {
        res.send(deletedcomment)
        console.log(deletedcomment)
    })
    .catch(err => {
        console.log(err)
        res.status(503).send({message: 'server error'})
    })
})


// router.put("/id", passport.authenticate('jwt', { session: false }), (req,res) => 
router.get('/:id', (req,res) =>
{
    db.Post.findById(req.params.id).populate({path:'author',select:'name'}).populate({path:'tags',select:'name'}).populate({path:"comments.author", select:"name"})
    .then(foundPost => {
        if(foundPost){
            res.send(foundPost)
        }else{
            res.status(404).send({message: 'Resource not located'})
        }
    })
    .catch(err => {
        console.log(err)
        res.status(503).send({message: 'Service Unavailable'})
    })
})

// router.put("/id", passport.authenticate('jwt', { session: false }), (req,res) => 
router.put('/:id', (req,res)=>
{
    db.Post.findOneAndUpdate({
        _id:req.params.id
    },
    req.body,
    {
        new: true
    })
    .then(updatedPost => {
        res.send(updatedPost)
        console.log(updatedPost)
    })
    .catch(err => {
        console.log(err)
        res.status(503).send({message: 'server error'})
    })
})



// router.delete("/id", passport.authenticate('jwt', { session: false }), (req,res) => 
router.delete('/:id', (req,res)=> 
{
    db.Post.findByIdAndDelete(req.params.id)
    .then(() => {
        res.status(204).send()
    })
    .catch(err=>{
        console.log(err)
        res.status(503).send({message: 'server error'})
    }) 
})

module.exports = router;