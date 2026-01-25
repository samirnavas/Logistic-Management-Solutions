Customer Client App – Full Product \& Technical Specification

1\. App Purpose (Plain English)



This is a customer-facing logistics management client application that allows users to:



Register and log in



Request shipment pickups



Upload shipment details and documents



Receive quotations



Track shipments in real time



View shipment history



Manage their profile



Contact support



The app does NOT handle admin or driver operations.

It is strictly for end customers of the logistics company.



2\. Target Platform



Client Application



Android



iOS



API-driven backend



Can be built using:



Flutter



React Native



Native Android / iOS



3\. User Type

Customer / Client



One user type only



Authenticated access required



Each user is linked to a unique Customer Code



4\. Navigation Architecture

Global Navigation



Bottom Tab Bar



Home



Quotation



Shipment



Profile



Global UI Elements



Hamburger menu (top-left)



Notifications icon (top-right)



Page titles



Consistent primary CTA buttons



5\. Screen-by-Screen Specification

5.1 Splash Screen



Purpose



Branding and app initialization



Behavior



Show logo and illustration



Auto-redirect after delay



Auth check:



Logged in → Home



Not logged in → Onboarding



5.2 Onboarding Screens



Purpose



Introduce app features



Elements



Illustrations (air, sea, cargo)



Headline text



Description text



Pagination dots



Buttons:



Skip



Next



Flow



Skip or finish → Login / Signup



5.3 Account Creation (Sign Up)



Fields



Full Name



Email



Mobile Number (with country code)



Location



Country



Accept Terms \& Privacy Policy (checkbox)



Actions



Create Account



Navigate to Login



Validation



All fields required



Valid email \& phone



Terms must be accepted



5.4 Login



Fields



Phone or Email



Password



Actions



Login



Forgot Password



Go to Sign Up



Logic



On success → Home screen



5.5 Home (Dashboard)



Purpose



Central overview of shipments



Sections

Greeting



“Hello, {UserName}”



Customer Code (copyable)



Status Overview Cards



Each shows a count:



Requests



Shipped



Delivered



Cleared



Dispatch



Waiting



Create New Request



Primary CTA button



Recent Shipments



Each card shows:



Shipment ID



Status badge



Box ID



Product category



Shipment mode (Air / Sea)



Expected delivery date



Buttons:



Track Shipment



View Details



Support



Floating “Open Chat” button



5.6 Create Shipment Request



Purpose



Submit a pickup request (quotation-based flow)



Sections

Shipping Mode



Air



Sea



Delivery Type



Door-to-Door



Warehouse Delivery



Package Details



Item Name



Number of Boxes



Total CBM



HS Code



Product Photos



Upload multiple images



Pickup Address



Full Name



Phone Number



Address Line



City



State



Country



ZIP / Postal Code



Address Type



Notes



Special instructions (optional)



CTA



Request Pickup



5.7 Request Confirmation Popup



Purpose



Submission feedback



Content



Success icon



Message with Request ID



Info: quotation will be shared soon



Action



Go to Dashboard



5.8 Shipment Tracking



Purpose



Real-time tracking



Components



Map view



Pickup \& current location markers



Shipment info panel:



Booking ID



Status



Created date



From / To



Customer name



Order cost



Quantity



Weight



Behavior



Read-only



Updates from backend



5.9 Quotation List



Purpose



View received quotations



Each item



Quotation ID



Date



View Quotation button



5.10 Quotation Detail



Purpose



Detailed pricing document



Content



Company header



Shipment info



Itemized cost table



Taxes



Total amount



Currency formatting



Display



PDF or in-app document viewer



5.11 Terms \& Conditions (Quotation)



Purpose



Legal disclosure



Content



Scrollable legal text



No interaction



5.12 Shipments List



Purpose



Full shipment history



Each item



Shipment ID



Status



Product



Mode



Expected delivery



Track / View buttons



5.13 Profile



Purpose



User account management



Content



Profile image



Name



Email



Editable personal fields



Logout



6\. Shipment Lifecycle

REQUESTED

→ QUOTED

→ CONFIRMED

→ PICKED\_UP

→ IN\_TRANSIT

→ DELIVERED



7\. Core Data Models

User



id



name



email



phone



country



customer\_code



ShipmentRequest



id



user\_id



shipping\_mode



delivery\_type



package\_details



pickup\_address



notes



status



Shipment



id



request\_id



tracking\_id



origin



destination



status



quantity



weight



Quotation



id



request\_id



pricing



taxes



total



pdf\_url



8\. API Contract (Example)



POST /auth/register



POST /auth/login



GET /dashboard



POST /shipment/request



GET /shipments



GET /shipments/{id}



GET /shipments/{id}/track



GET /quotations



GET /quotation/{id}



