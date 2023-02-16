const express = require("express");
const router = express.Router();

//importing data model schemas
let { orgdata } = require("../models/models");

//GET all entries
router.get("/", (req, res, next) => { 
    orgdata.find( 
        (error, data) => {
            if (error) {
                return next(error);
            } else {
                res.json(data);
            }
        }
    ).sort({ 'updatedAt': -1 }).limit(10);
});

//GET single entry by ID
router.get("/id/:id", (req, res, next) => { 
    orgdata.find({ _id: req.params.id }, (error, data) => {
        if (error) {
            return next(error)
        } else {
            res.json(data)
        }
    })
});

//GET Data for org using enviornment variable
router.get("/current_org", (req, res, next) => { 
    orgdata.find({ _id: process.env.ORG }, (error, data) => {
        if (error) {
            return next(error)
        } else {
            res.json(data)
        }
    })
});

/*

//POST Create an org
router.post("/", (req, res, next) => { 
    orgdata.create( 
        req.body, 
        (error, data) => { 
            if (error) {
                return next(error);
            } else {
                res.json(data);
            }
        }
    );
});

//PUT Temporarily update enviornment variable until server restart
router.put("/change_org", (req, res, next) => { 
    process.env["ORG"] = req.body.org;
    res.json({"status": "success"})
});

//PUT update (make sure req body doesn't have the id)
router.put("/:id", (req, res, next) => { 
    orgdata.findOneAndUpdate( 
        { _id: req.params.id }, 
        req.body,
        (error, data) => {
            if (error) {
                return next(error);
            } else {
                res.json(data);
            }
        }
    );
});

//DELETE (deletes an organization by ID)
router.delete("/:id", (req, res) => {
    orgdata.findOneAndDelete({_id: req.params.id},(err,result)=>{
        if (err)
            console.log(err);
        else
            res.json(result);
    });
});

*/

module.exports = router;
