# Restaurant Management System

A full-stack restaurant management system with real-time order tracking and delivery partner management.

## Features

### For Managers

- **Dashboard**: Overview of orders, delivery partners, and statistics
- **Order Management**: Create, view, update, and assign orders to delivery partners
- **Delivery Partner Management**: Add, edit, and remove delivery partners
- **Real-time Updates**: Live updates on order status and partner availability
- **Statistics**: Track total orders, active orders, and available partners

### For Delivery Partners

- **Personal Dashboard**: View assigned orders and delivery history
- **Status Management**: Update order status (Ready → Out for Delivery → Delivered)
- **Availability Control**: Toggle availability status
- **Real-time Notifications**: Receive new order assignments and updates

## Technology Stack

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend

- **React** with functional components and hooks
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Socket.IO Client** for real-time updates
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd restaurant-management-system
   ```

2. **Install backend dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the server directory:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/restaurant-management
   JWT_SECRET=your-secret-key-here
   NODE_ENV=development
   ```

   Create a `.env` file in the client directory:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. **Start the servers**

   Backend:

   ```bash
   cd server
   npm start
   ```

   Frontend:

   ```bash
   cd client
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/delivery-partners` - Get all delivery partners (Manager only)
- `POST /api/auth/delivery-partners` - Create delivery partner (Manager only)
- `PUT /api/auth/delivery-partners/:id` - Update delivery partner (Manager only)
- `DELETE /api/auth/delivery-partners/:id` - Delete delivery partner (Manager only)

### Orders

- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order (Manager only)
- `PUT /api/orders/:id` - Update order (Manager only)
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/assign` - Assign delivery partner (Manager only)
- `DELETE /api/orders/:id` - Delete order (Manager only)

### Delivery

- `GET /api/delivery/current-order` - Get current assigned order (Delivery Partner)
- `GET /api/delivery/order-history` - Get order history (Delivery Partner)
- `PUT /api/delivery/availability` - Update availability (Delivery Partner)
- `GET /api/delivery/stats` - Get delivery statistics (Delivery Partner)
- `GET /api/delivery/available` - Get available partners (Manager)

## Real-time Events

The system uses Socket.IO for real-time communication:

### Order Events

- `orderCreated` - New order created
- `orderStatusUpdated` - Order status changed
- `orderAssigned` - Order assigned to delivery partner
- `orderUpdated` - Order details updated
- `orderDeleted` - Order deleted

### Delivery Partner Events

- `deliveryPartnerCreated` - New delivery partner created
- `deliveryPartnerUpdated` - Delivery partner details updated
- `deliveryPartnerDeleted` - Delivery partner deleted
- `deliveryPartnerAvailabilityChanged` - Partner availability changed

## User Roles

### Manager

- Create and manage orders
- Assign delivery partners to orders
- Add, edit, and remove delivery partners
- View comprehensive dashboard with statistics
- Monitor all system activity

### Delivery Partner

- View assigned orders
- Update order status during delivery
- Toggle availability status
- View delivery history and personal statistics
- Receive real-time order assignments

## Delivery Partner Management

### Adding a New Delivery Partner

1. Navigate to the "Delivery Partners" tab in the manager dashboard
2. Click "Add Partner"
3. Fill in the required information:
   - Username
   - Email
   - Password
   - Estimated Delivery Time (in minutes)
4. Submit the form

### Managing Existing Partners

- **Edit**: Click the "Edit" button to modify username or delivery time
- **Toggle Availability**: Use the availability button to make partners available/unavailable
- **Delete**: Remove partners (only if they have no active orders)

### Real-time Updates

All partner management actions are reflected in real-time across all connected clients, ensuring managers always have up-to-date information.

## Order Flow

1. **Manager creates order** → Order appears in dashboard
2. **Manager assigns delivery partner** → Partner receives notification
3. **Partner updates status to "Out for Delivery"** → Real-time update sent
4. **Partner marks as "Delivered"** → Order completed, partner becomes available

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
