const express = require("express"); 
const router = express.Router();
const { body, check, checkSchema, validationResult } = require("express-validator");
const errorHelper = (res, error, code, msg) => {
    if (error) return res.status(code).jsonp({ "msg": msg});
    return res.json(data);
}

const intakeFormSchema = {
    firstName: {
        isString: true,
        isAlpha: true,
        isEmpty: false,
        errorMessage: "first name is required"
    },
    lastName: {
        isString: true,
        isAlpha: true,
        isEmpty: false,
        errorMessage: "last name is required"
    },
    email: {
        isEmail: true,
    },
    "phoneNumbers.*.primaryPhone": {
        isMobilePhone: true
    },
    "address.city": {
        isEmpty: false,
    }
}

//importing data model schemas
let { primarydata } = require("../models/models");

//GET all entries
router.get("/", (req, res, next) => { 
    // Find all client documents in the current organization instance
    primarydata.find( {"organization_id": process.env.ORG},
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
    primarydata.find( 
        // Find a single client document in the current organization instance using client ID
        { "organization_id": process.env.ORG, _id: req.params.id },
        (error, data) => {
            if (error) {
                return next(error);
            } else {
                res.json(data);
            }
        }
    );
});

//GET entries based on search query
//Ex: '...?firstName=Bob&lastName=&searchBy=name' 
router.get("/search/", (req, res, next) => { 
    let dbQuery = "";
    if (req.query["searchBy"] === 'name') {
        // Find all client documents in the current organization with either the corresponding search of the client's first name and/or last name
        dbQuery = { firstName: { $regex: `^${req.query["firstName"]}`, $options: "i" }, lastName: { $regex: `^${req.query["lastName"]}`, $options: "i" }, "organization_id": process.env.ORG }
    } else if (req.query["searchBy"] === 'number') {
        dbQuery = {
            // Find all client documents in the current organization with the corresponding search of the client phone number
            "phoneNumbers.primaryPhone": { $regex: `^${req.query["phoneNumbers.primaryPhone"]}`, $options: "i" }, "organization_id": process.env.ORG
        }
    };
    primarydata.find( 
        dbQuery,
        (error, data) => { 
            if (error) {
                return next(error);
            } else {
                res.json(data);
            }
        }
    );
});

//GET events for a single client
router.get("/events/:id", (req, res, next) => { 
    primarydata.findById(req.params.id, (error, data) => {
        if (error) {
            return next(error);
        } else {
            return res.json(data);
        }
    });
});

//GET number of clients per Event


//POST
// Adding validation checks for posting primary data
router.post("/", checkSchema(intakeFormSchema), (req, res, next) => { 
    // Returns a 422 error if one of the validation checks aren't met
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(422).jsonp(errors.array())
    }
    // Setting the organization ID of the added client to be the organization of the current organziation instance
    req.body.organization_id = process.env.ORG
    // Returns a 500 error with a json response
    primarydata.create(req.body, (error, data) => { 
        if(error) return errorHelper(res, error, 500, "database error")
        return res.json(data)
    });
    primarydata.createdAt;
    primarydata.updatedAt;
    primarydata.createdAt instanceof Date;
});

//PUT update (make sure req body doesn't have the id)
// Adding validation checks for updating primary data
router.put("/:id", (req, res, next) => { 
    // Returns a 422 error if one of the validation checks aren't met
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(422).jsonp(errors.array())
    }
    // Returns a 500 error with a json response
    primarydata.findOneAndUpdate( { _id: req.params.id, }, req.body,(error, data) => {
        if(error) return errorHelper(res, error, 500, "database error")
        return res.json(data)
    });
});

//DELETE (deletes a client by ID)
router.delete("/:id", (req, res) => {
    primarydata.findOneAndDelete({_id: req.params.id},(err,result)=>{
        if (err)
            console.log(err);
        else
            res.json(result);
    });
});


module.exports = router;
