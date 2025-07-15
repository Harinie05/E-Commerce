# Simple E-commerce API

## Features

- Product Listings (with optional pagination/search)
- Cart Management
- Order Creation
- User Authentication (customer/admin roles)
- MySQL Database

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root with:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=ecommerce_db
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```
3. Set up your MySQL database and user.
4. Run the app:
   ```bash
   npm run dev
   ```
