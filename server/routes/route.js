import express from 'express';
const router = express.Router();
router.get('/', (req, res) => {
    res.send('server is running!');
});
export { router };
//# sourceMappingURL=route.js.map