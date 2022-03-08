const express = require('express')
const router = express.Router()
const checkLogin = require('../middelwares/checkLogin');

const {
    getAllFeeds,
    getFeed,
    createFeed,
    updateFeed,
    deleteFeed
} = require('../controllers/feeds');

router.get("/", getAllFeeds);
router.get("/:feedID", getFeed)
// for registers only:
router.post("/", checkLogin, createFeed);
router.patch("/:feedID", checkLogin, updateFeed);
router.delete("/:feedID", checkLogin, deleteFeed);

module.exports = router;