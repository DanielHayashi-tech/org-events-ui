const express = require("express");
const router = express.Router();
const { body, check, checkSchema, validationResult } = require("express-validator");
const errorHelper = (res, error, code, msg) => {
    if (error) return res.status(code).jsonp({ "msg": msg});
    return res.json(data);
}

const eventSchema = {
    eventName: {
        isString: true,
        isEmpty: false,
        errorMessage: "event name is required"
    },
    date: {
        isDate: true,
        isEmpty: false,
        errorMessage: "date is required"
    }
}

//importing data model schemas
let { eventdata } = require("../models/models");

//GET all entries
router.get("/", (req, res, next) => { 
    // Find all event documents in the current organization instance
    eventdata.find( {"organization_id": process.env.ORG},
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
    eventdata.find(
        // Find a single event document in the current organization instance using event ID
        { "organization_id": process.env.ORG, _id: req.params.id }, 
        (error, data) => {
        if (error) {
            return next(error)
        } else {
            res.json(data)
        }
    })
});

//GET entries based on search query
router.get("/search/", (req, res, next) => { 
    let dbQuery = "";
    if (req.query["searchBy"] === 'name') {
        // Find all event documents in the current organization with the corresponding search of the event name
        dbQuery = { eventName: { $regex: `^${req.query["eventName"]}`, $options: "i" }, "organization_id": process.env.ORG }
    } else if (req.query["searchBy"] === 'date') {
        dbQuery = {
            // Find all event documents in the current organization with the corresponding search of the event date
            date:  req.query["eventDate"]
        }
    };

    eventdata.find( 
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

//GET events for the last 2 months
// Getting the amount of attendees for each event will be done in the front end
router.get("/event-data", (req, res, next) => {
    // Set date cutoff to previous 2 months
    let pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 2);
    // Find events with dates within the last 2 months of the current date
    eventdata.find({"date": {"$gte": pastDate, "$lt": new Date()}, "organization_id": process.env.ORG}, (error, data) => { 
        if (error) {
            return next(error);
        } else {
            res.json(data);
        }
    });
});

//GET events for which a client is signed up
router.get("/client/:id", (req, res, next) => { 
    eventdata.find( 
        { attendees: req.params.id }, 
        (error, data) => { 
            if (error) {
                return next(error);
            } else {
                res.json(data);
            }
        }
    );
});

//POST
// Adding validation checks for posting event data
router.post("/", checkSchema(eventSchema), (req, res, next) => { 
    // Returns a 422 error if one of the validation checks aren't met
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(422).jsonp(errors.array())
    }
    // Setting the organization ID of the added event to be the organization of the current organziation instance
    req.body.organization_id = process.env.ORG
    eventdata.create(req.body, (error, data) => { 
        // Returns a 500 error with a json response
        if(error) return errorHelper(res, error, 500, "database error")
        return res.json(data)
    });
});

//PUT add attendee to event
router.put("/addAttendee/:id", (req, res, next) => {
    //only add attendee if not yet signed up
    eventdata.find(
        { _id: req.params.id, attendees: req.body.attendee },
        (error, data) => {
            if (error) {
                return next(error);
            } else {
                if (data.length == 0) {
                    eventdata.updateOne(
                        { _id: req.params.id },
                        { $push: { attendees: req.body.attendee } },
                        (error, data) => {
                            if (error) {
                                return next(error);
                            } else {
                                res.json(data);
                            }
                        }
                    );
                }
            }
        }
    );
});

//PUT
// Adding validation checks for updating event data
router.put("/:id",  [
    check("eventName")
        .isString()
        .not().isEmpty().withMessage("event name is required"),
    check("date")
        .isDate()
        .not().isEmpty().withMessage("date is required")
], (req, res, next) => {
    // Returns a 422 error if one of the validation checks aren't met
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(422).jsonp(errors.array())
    }
    // Returns a 500 error with a json response
    eventdata.findOneAndUpdate({ _id: req.params.id },req.body,(error, data) => {
        if(error) return errorHelper(res, error, 500, "database error")
        return res.json(data)  
    });
});


//DELETE (deletes an event by ID)
router.delete("/:id", (req, res) => {
    eventdata.findOneAndDelete({_id: req.params.id},(err,result)=>{
        if (err)
            console.log(err);
        else
            res.json(result);
    });
});

module.exports = router;
