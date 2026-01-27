# 📝 Changelog

All notable changes to Harkat Furniture project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned Features
- [ ] Multi-language support (Indonesian/English)
- [ ] Voucher/discount system
- [ ] Mobile app (React Native)


---

## [1.3.0] - 2026-01-27

### Added
- **Product Reviews & Ratings**
  - Star rating system (1-5 stars)
  - Customer reviews with title and comment
  - Review summary with rating distribution bars
  - Average rating display on product page
  - Verified purchase badge support
  - Indonesian localization for date formats
  - Database tables: `product_reviews` with indexes

- **Wishlist Functionality**
  - Heart button on product detail page
  - Dedicated wishlist page at `/customer/wishlist`
  - LocalStorage persistence for guest users
  - Database sync for logged-in users
  - Add to cart from wishlist
  - Database tables: `wishlists` with unique constraint

### Changed
- Updated `SocialProofBanner` to use real review statistics from API
- Added Wishlist menu item to customer sidebar navigation

### Technical
- New API endpoints:
  - `GET/POST /api/reviews` - Fetch and create reviews
  - `PATCH/DELETE /api/reviews/[id]` - Update and delete reviews
  - `GET/POST/DELETE /api/wishlist` - Wishlist CRUD operations
- New components: `ReviewForm`, `ReviewList`, `ReviewSummary`, `ReviewSection`

---

## [1.2.0] - 2026-01-25

### Added
- **WhatsApp Bot Deployment (Railway)**
  - Successfully deployed `harkat-whatsapp-bot` to Railway
  - Implemented `zaileys` library for improved connection stability
  - Added new `/qr` endpoint for direct QR code scanning
  - Added new `/qr` endpoint for direct QR code scanning
  - File-based logging for easier debugging
- **Admin Chat Interface**
  - Real-time chat UI for admins to reply to WhatsApp users
  - Toggle between "Bot Mode" and "Human Mode"
  - Conversation history view

### Fixed
- **WhatsApp Connection Issues**
  - Resolved "Bot Offline" status in admin panel
  - Fixed `wa.initialize()` startup logic in bot source code
  - Corrected event handling for `connection` events (handling Object payload)
  - Patched frontend API to prevent caching of status checks

### Changed
- **Bot Configuration**
  - Migrated from Fly.io to Railway for better stability and pricing
  - Updated regex matching for Indonesian phone numbers
  - improved error handling in admin panel status checks

---

## [1.1.0] - 2026-01-24

### Added
- **Categories Image Upload**
  - File upload functionality for category images
  - Image validation (max 5MB, JPG/PNG/WebP/GIF)
  - Upload API endpoint `/api/upload/categories`
  - Image preview with delete option
  
### Changed
- **Admin Layout Improvements**
  - Removed redundant top header bar
  - Moved logout button to sidebar for cleaner interface
  - User profile section now includes logout icon button
  - Content area now takes full height without header
  
- **Categories Page Refactoring**
  - Removed `isActive` field (not in database schema)
  - Updated backend API to support PATCH method for updates
  - Added `image` field support in POST and PATCH endpoints
  - Cleaned up unused imports (Card, Badge, Switch, CheckCircle, XCircle)
  - Fixed stats calculation to remove isActive references
  
- **Audit Logs Page Standardization**
  - Implemented "extreme minimal" 2-row header design
  - Moved stats from 5 separate cards to inline badges
  - Reduced header height by ~60%
  - Integrated filters and search into compact header
  - Standardized component sizing (buttons h-7, inputs h-8, icons w-3.5 h-3.5)
  - Cleaned up unused imports (Card components, Activity icon)

### Fixed
- **Orders Page**
  - Fixed sticky table header not working properly
  - Added proper flex container structure for freeze header
  - Table header now stays fixed when scrolling
  
- **Categories Backend**
  - Added missing PATCH endpoint for category updates
  - Improved activity logging for all operations
  - Fixed frontend-backend field mismatch

### Technical
- Standardized all admin pages to use consistent "extreme minimal" header pattern
- Improved table container structures across admin pages for proper sticky headers
- Enhanced API endpoints with better error handling and logging

---

## [1.0.0] - 2026-01-23

### 🎉 Initial Release

#### Added - Core Features
- **E-Commerce Platform**
  - Multi-variant product system with attribute matrix
  - Product catalog with categories
  - Shopping cart with persistent storage
  - Responsive IKEA-inspired UI design
  - Advanced search and filtering
  - Image gallery for products and variants

- **Order Management**
  - Complete order workflow (PENDING → PAID → PROCESSING → SHIPPED → DELIVERED)
  - Dual payment methods (Bank Transfer + Pakasir Gateway)
  - Payment proof upload system
  - Order tracking with real-time status updates
  - Volumetric weight calculation for shipping
  - Automatic order number generation

- **Logistics System**
  - Internal fleet management
  - Third-party shipping integration (Komerce/RajaOngkir)
  - GPS tracking for drivers
  - Electronic Proof of Delivery (e-POD)
  - Driver task assignment and management
  - Route optimization

- **Fleet Management**
  - Vehicle registry and tracking
  - Fuel consumption logging
  - Maintenance scheduling and logs
  - Driver-vehicle assignment
  - Cost tracking and reporting

- **WhatsApp Integration**
  - Automated order notifications
  - Payment confirmations
  - Shipping updates
  - Delivery alerts
  - Broadcast messaging system
  - OTP verification
  - Customizable message templates

- **User Management**
  - Role-based access control (RBAC)
  - 4 user roles: SUPER_ADMIN, ADMIN, DRIVER, CUSTOMER
  - Email verification with Resend
  - Secure authentication with NextAuth.js
  - Activity logging and audit trail

- **Admin Dashboard**
  - Sales analytics and reporting
  - Inventory management
  - Order processing interface
  - User management
  - Fleet management
  - System settings

- **Driver App**
  - Task list view
  - GPS location tracking
  - Photo and signature capture for POD
  - Task status updates
  - Fuel logging

#### Technical Stack
- **Frontend**: Next.js 15, TypeScript 5, Tailwind CSS 4
- **UI Components**: shadcn/ui, Radix UI, Lucide React
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js v4
- **Email**: Resend API
- **Payment**: Pakasir Gateway
- **Shipping**: Komerce API, RajaOngkir
- **Maps**: Google Maps API
- **WhatsApp**: Baileys library
- **File Storage**: Cloudflare R2
- **Image Processing**: Sharp

#### Security Features
- Bcrypt password hashing
- CSRF protection
- SQL injection prevention (Drizzle ORM)
- XSS protection
- Input validation with Zod
- Activity logging for audit trail
- Secure session management
- Payment webhook signature verification

#### Documentation
- Comprehensive README.md
- API documentation
- Deployment guide
- Security implementation guide
- Environment configuration examples

---

## [0.9.0] - 2026-01-22

### Added
- IKEA-inspired homepage redesign
- Noto Sans font integration
- Enhanced product card design with floating cart buttons
- Red discount badges
- Improved category tiles layout
- Clean white header with centered search bar

### Changed
- Updated color scheme to match IKEA branding
- Refined product card specifications
- Improved mobile responsiveness

### Fixed
- Category tile image layout issues
- Product card spacing and alignment
- Header search bar positioning

---

## [0.8.0] - 2026-01-17

### Added
- Driver finance integration
- Fuel logging system
- Maintenance tracking
- Cost analysis reports

### Changed
- Enhanced driver task workflow
- Improved POD UI with compact design
- Refined task status transitions

### Fixed
- Driver task status update issues
- POD photo upload functionality
- Task detail page UI bugs

---

## [0.7.0] - 2026-01-16

### Added
- Pakasir payment gateway integration
- Payment webhook handling
- Virtual account and QRIS support
- Payment URL redirection

### Changed
- Order creation flow to support payment gateway
- Order status management for payment states

### Security
- Implemented payment signature verification
- Added webhook security measures

---

## [0.6.0] - 2025-12-28

### Added
- WhatsApp bot for order notifications
- Automated message templates
- Broadcast messaging system
- OTP verification via WhatsApp

### Changed
- Improved notification delivery reliability
- Enhanced message formatting

### Fixed
- WhatsApp connection stability issues
- Message delivery failures
- QR code scanning problems

---

## [0.5.0] - 2025-12-22

### Added
- Customer role and dashboard
- Enhanced authentication system
- Login CTA dynamic updates

### Fixed
- Frequent logout issues on browser back button
- Session persistence problems
- Auth state management

---

## [0.4.0] - 2025-12-21

### Added
- Admin CRUD operations for all entities
- Product variant management
- Inventory tracking with low-stock alerts
- Order management interface

### Changed
- Improved admin dashboard UI
- Enhanced data table components

### Fixed
- CRUD operation bugs
- Data validation issues

---

## [0.3.0] - 2025-12-13

### Added
- Performance optimization protocols
- Image resizing for media uploads
- Next.js compiler optimizations
- Database indexing

### Changed
- Refined data fetching strategies
- Improved loading states

### Performance
- Reduced image loading times
- Optimized database queries
- Improved overall responsiveness

---

## [0.2.0] - 2025-12-13

### Added
- Filament v4 demo exploration
- Advanced form layouts
- Relation managers
- Custom widgets

### Technical
- Laravel 11 playground setup
- PostgreSQL configuration
- Filament Resources implementation

---

## [0.1.0] - 2025-12-13

### Added
- Initial project setup
- Basic e-commerce structure
- Product catalog
- Shopping cart
- User authentication

### Technical
- Next.js 15 setup
- Drizzle ORM configuration
- PostgreSQL database
- Basic UI components

---

## Version History Summary

| Version | Date | Key Features |
|---------|------|--------------|
| 1.2.0 | 2026-01-25 | WhatsApp Bot Railway Deployment & Connection Fix |
| 1.1.0 | 2026-01-24 | Admin UI improvements, Categories image upload, Audit Logs standardization |
| 1.0.0 | 2026-01-23 | Initial production release |
| 0.9.0 | 2026-01-22 | IKEA redesign |
| 0.8.0 | 2026-01-17 | Driver finance integration |
| 0.7.0 | 2026-01-16 | Pakasir payment gateway |
| 0.6.0 | 2025-12-28 | WhatsApp integration |
| 0.5.0 | 2025-12-22 | Customer dashboard |
| 0.4.0 | 2025-12-21 | Admin CRUD operations |
| 0.3.0 | 2025-12-13 | Performance optimization |
| 0.2.0 | 2025-12-13 | Filament exploration |
| 0.1.0 | 2025-12-13 | Initial setup |

---

## Contributing

When adding entries to this changelog:

1. **Group changes** by type: Added, Changed, Deprecated, Removed, Fixed, Security
2. **Use present tense**: "Add feature" not "Added feature"
3. **Reference issues**: Include issue numbers when applicable
4. **Be specific**: Describe what changed and why
5. **Update version**: Follow semantic versioning

### Version Numbering

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features, backwards compatible
- **PATCH** (0.0.X): Bug fixes, backwards compatible

---

**Last Updated: January 24, 2026**
