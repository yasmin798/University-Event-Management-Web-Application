# Eventity
University Event Management Application

## 1. Motivation
Eventity is developed to provide a centralized system for managing university events, vendor participation, gym sessions, court reservations, workshop approvals, conference management, trip registrations, loyalty programs, and communication among students, staff, professors, vendors, and the Events Office.  
The goal of this system is to streamline event operations, automate approval cycles, ensure accurate role verification, provide structured registration workflows, and enhance the overall event participation experience for the university community.

## 2. Build Status
The system is functional on both frontend and backend with full connectivity to MongoDB.  
The following components are fully operational:

- User authentication (registration, login, logout)
- Verification emails for students, staff, TAs, and professors
- Vendor registration and document upload
- Event listing, filtering, searching, sorting
- Event registration and payment using Stripe
- Workshop, trip, bazaar, and conference creation
- Workshop approval cycle between Professors and Events Office
- Rating and commenting system
- Favorites feature
- Notifications and reminders
- Wallet refund logic
- Vendor participation workflows
- Court reservation system
- Gym schedule viewing and session registration
- Poll creation and voting
- Vendor loyalty program
- Reporting for total attendees and sales
- Document viewing and downloads

Known Issues / Limitations:
- Some frontend flows depend on manual refresh after backend operations
- Stripe webhook handling requires deployment for production reliability
- Some administrative views may require further UI refinement
- Form validations could be expanded
- File upload size and type restrictions can be enhanced
- Some asynchronous operations lack error boundary handling on the frontend

## 3. Code Style
- Naming convention: camelCase for variables and functions.
- Models use PascalCase.
- Controllers organized by functional modules.
- Routes separated by domain (auth, events, vendors, admin).
- Folder structure follows Node.js MVC methodology.

## 4. Screenshots
Screenshots located in:  
`/assets/screenshots/`

### 1. Signup Page
![Signup](assets/screenshots/ss9.png)

### 2. Login Page
![Login](assets/screenshots/ss8.png)

### 3. Discover Events
![Discover Events](assets/screenshots/sss1.png)

### 4. Event Details
![Event Details](assets/screenshots/sss2.png)

### 5. Event Registration Form
![Event Registration](assets/screenshots/sss3.png)

### 6. Favorites Page
![Favorites](assets/screenshots/sss4.png)

### 7. Wallet Page
![Wallet](assets/screenshots/sss5.png)

### 8. Vendor Booth Application
![Vendor Application](assets/screenshots/sss6.png)

### 9. Vendor Accepted Applications
![Vendor Accepted](assets/screenshots/sss7.png)

### 10. Payment Page
![Payment Page](assets/screenshots/sss8.png)

## 5. Technologies and Frameworks Used
Backend:
- Node.js  
- Express.js  
- MongoDB (Mongoose ORM)  
- Nodemailer  
- Stripe  
- JWT  
- Multer

Frontend:
- ReactJS  
- Axios  
- React Router  
- Context API  

Other:
- Stripe CLI

## 6. Features
The system supports all major user groups. Features include:

- Role-based authentication  
- Email verification  
- Vendor onboarding  
- Event browsing, filtering, sorting  
- Rating and commenting  
- Favorites  
- Event creation and approvals  
- Vendor participation workflows  
- Payments via Stripe  
- Wallet refunds  
- Notifications  
- Court reservations  
- Gym session registration  
- Voting polls  
- Loyalty program  
- Reporting  

## 7. Code Examples

### Example 1: User Registration Controller
```javascript
exports.registerUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role, idNumber } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already registered" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            idNumber,
            isVerified: false
        });

        await user.save();
        await sendVerificationEmail(user.email, user._id);

        res.status(201).json({ message: "Registration successful. Verification email sent." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

### Example 2: Login Controller
```javascript
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified)
        return res.status(403).json({ message: "Please verify your email before logging in." });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    res.status(200).json({ token, user });
};
```

### Example 3: Workshop Creation
```javascript
exports.createWorkshop = async (req, res) => {
    try {
        const workshop = new Workshop({
            ...req.body,
            professorId: req.user.id,
            status: "Pending"
        });
        await workshop.save();
        res.status(201).json(workshop);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

### Example 4: Stripe Payment
```javascript
exports.payForEvent = async (req, res) => {
    try {
        const { amount, eventId } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: "egp",
            metadata: { eventId, userId: req.user.id }
        });

        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

### Example 5: Notification Sender
```javascript
exports.sendNotification = async (userId, message) => {
    const notification = new Notification({
        userId,
        message,
        createdAt: new Date()
    });
    await notification.save();
};
```

## 8. Installation

### Backend
```
cd server
npm install
npm run dev
```

### Frontend
```
cd client
npm install
npm start
```

### .env.example
```
PORT=3000
MONGO_URI=YOUR_MONGO_URI
JWT_SECRET=YOUR_JWT_SECRET
EMAIL_USER=YOUR_EMAIL
EMAIL_PASS=YOUR_EMAIL_APP_PASSWORD
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
CLIENT_URL=http://localhost:3001
```

## 9. API References

### Authentication
```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

---

### Events
```
GET /api/all
GET /api/events/:eventId
POST /api/events/:eventId/register
```

---

### Workshops
```
POST /api/workshops/create
GET /api/workshops/my-workshops
```

---

### Vendors
```
POST /api/vendor/apply
GET /api/vendor/my-requests
```

---

### Payments (Stripe)
```
POST /api/payments/create-session
POST /api/payments/pay-event
POST /api/payments/refund-event
POST /api/payments/confirm
POST /api/payments/confirm-event-payment
POST /api/payments/confirm-event-payment-and-email
```

---

### Reports
```
GET /api/reports/attendance
GET /api/reports/sales
```


### Authentication
```
POST /auth/register
POST /auth/login
GET /auth/verify/:id
```

### Events
```
GET /events
POST /events/register
GET /events/:id
```

### Payments
```
POST /payment/pay
POST /payment/webhook
```

### Vendors
```
POST /vendor/apply
GET /vendor/my-requests
```

### Workshops
```
POST /workshops/create
GET /workshops/my-workshops
```

## 10. Tests
Postman was used for testing.  
At least five test screenshots will be added, including:

Screenshots stored under `/assets/screenshots/`.

### 1. Signup Test
![Signup Test](assets/screenshots/ss1.png)

### 2. Login Test
![Login Test](assets/screenshots/ss2.png)

### 3. Get All Events
![Get Events](assets/screenshots/ss6.png)

### 4. Search Events
![Search Events](assets/screenshots/sss9.png)

### 5. Filter Events
![Filter Events](assets/screenshots/ssss1.png)

### 6. Logout Test
![Logout Test](assets/screenshots/ss7.png)  

## 11. Contribute
Contributions may be made through issues or pull requests.  
All contributors should follow the project’s structure and naming conventions.

## 12. Credits
- Stripe Documentation  
- Nodemailer Documentation  
- MongoDB Documentation  
- StackOverflow  
- YouTube tutorials related to Node.js and React

## 13. License
This project is licensed under the MIT License.
