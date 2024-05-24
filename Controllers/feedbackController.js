const FeedBack = require('../Model/feedBack')
const jwt = require('jsonwebtoken');




exports.getFeedBack = async (req, res) => { 
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        jwt.verify(token, 'your_secret_key_here', async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            const query = `
                SELECT f.*, u.username, i.title AS incidentTitle 
                FROM FeedBacks f 
                INNER JOIN Users u ON f.userId = u.id 
                INNER JOIN incidents i ON f.incidentId = i.id
            `;
            FeedBack.query(query, (error, results, fields) => {
                if (error) {
                    console.error('Error retrieving feedbacks:', error);
                    return res.status(500).json({ error: 'An error occurred while retrieving feedbacks' });
                }
                res.status(200).json(results);
            });
        });
    } catch (err) {
        console.error('Error retrieving feedbacks:', err);
        res.status(500).json({ error: 'An error occurred while retrieving feedbacks' });
    }
};

  
exports.submitFeedBack = async (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        jwt.verify(token, 'your_secret_key_here', async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            const { value, incidentId } = req.body;
            const userId = decoded.userId;

            if (!value) {
                return res.status(400).json({ error: 'A value is required' });
            }

            // Check if the value is within the valid range (0 to 5)
            if (value < 0 || value > 5) {
                return res.status(400).json({ error: 'Value must be between 0 and 5' });
            }

            try {
                const query = `
                    INSERT INTO FeedBacks (value, userId, incidentId) 
                    VALUES (?, ?, ?);
                `;
                FeedBack.query(query, [value, userId, incidentId], (error, results, fields) => {
                    if (error) {
                        console.error('Error saving feedback:', error);
                        return res.status(500).json({ error: 'An error occurred while saving the feedback' });
                    }
                    // Fetch incident title corresponding to the incidentId
                    const incidentTitleQuery = `
                        SELECT title FROM incidents WHERE id = ?;
                    `;
                    FeedBack.query(incidentTitleQuery, [incidentId], (incidentError, incidentResults, incidentFields) => {
                        if (incidentError) {
                            console.error('Error fetching incident title:', incidentError);
                            return res.status(500).json({ error: 'An error occurred while fetching incident title' });
                        }
                        const title = incidentResults[0] ? incidentResults[0].title : null;
                        res.status(201).json({ message: 'Feedback sent successfully', incidentId, title });
                    });
                });
            } catch (error) {
                console.error('Error saving feedback:', error);
                res.status(500).json({ error: 'An error occurred while saving the feedback' });
            }
        });
    } catch (err) {
        console.error('Error verifying token:', err);
        res.status(500).json({ error: 'An error occurred while verifying token' });
    }
};


exports.calculateOverallAverageFeedback = async (req, res) => {
    try {
        const query = `
            SELECT HOUR(created_at) AS hourOfDay, AVG(value) AS averageValue
            FROM Feedbacks
            GROUP BY hourOfDay;
        `;
        
        FeedBack.query(query, (error, results, fields) => {
            if (error) {
                console.error('Error calculating overall average feedback:', error);
                return res.status(500).json({ error: 'An error occurred while calculating the overall average feedback' });
            }
            const overallAverageFeedback = results.map(row => ({
                hourOfDay: row.hourOfDay,
                averageValue: row.averageValue
            }));
            res.status(200).json({ overallAverageFeedback });
        });
    } catch (error) {
        console.error('Error calculating overall average feedback:', error);
        res.status(500).json({ error: 'An error occurred while calculating the overall average feedback' });
    }
};


exports.calculateAverageFeedbackPerIncident = async (req, res) => {
    try {
        const query = `
        SELECT f.incidentId, i.title AS incidentTitle, t.name AS teamName, ROUND(AVG(f.value), 1) AS average_value
        FROM Feedbacks f
        INNER JOIN incidents i ON f.incidentId = i.id
        INNER JOIN teams t ON i.teamId = t.id
        GROUP BY f.incidentId;
        `;
        
        FeedBack.query(query, (error, results, fields) => {
            if (error) {
                console.error('Error calculating average feedback per incident:', error);
                return res.status(500).json({ error: 'An error occurred while calculating the average feedback per incident' });
            }
            const averageFeedbackPerIncident = results.map(row => ({
                incidentId: row.incidentId,
                incidentTitle: row.incidentTitle,
                teamName: row.teamName,
                averageValue: row.average_value
            }));
            res.status(200).json({ averageFeedbackPerIncident });
        });
    } catch (error) {
        console.error('Error calculating average feedback per incident:', error);
        res.status(500).json({ error: 'An error occurred while calculating the average feedback per incident' });
    }
};