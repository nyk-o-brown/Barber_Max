
// Booking page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize booking process
    let selectedServices = [];
    let selectedBarber = null;
    let selectedLocation = null;
    let selectedTime = null;
    
    // Service selection handler
    document.querySelectorAll('.service-option input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const serviceCard = this.closest('.service-option');
            if (this.checked) {
                serviceCard.style.borderColor = '#000';
                const serviceName = serviceCard.querySelector('h3').textContent;
                const servicePrice = serviceCard.querySelector('span').textContent;
                selectedServices.push({
                    name: serviceName,
                    price: servicePrice
                });
            } else {
                serviceCard.style.borderColor = '#e5e7eb';
                const serviceName = serviceCard.querySelector('h3').textContent;
                selectedServices = selectedServices.filter(service => service.name !== serviceName);
            }
            localStorage.setItem('selectedServices', JSON.stringify(selectedServices));
        });
    });
    
    // Barber selection handler
    document.querySelectorAll('.barber-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.tagName !== 'INPUT') {
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;
                selectedBarber = {
                    name: this.querySelector('h3').textContent,
                    rating: this.querySelectorAll('.fill-current').length
                };
                localStorage.setItem('selectedBarber', JSON.stringify(selectedBarber));
            }
        });
    });
    
    // Location selection handler
    document.querySelectorAll('.location-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.tagName !== 'INPUT') {
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;
                selectedLocation = {
                    name: this.querySelector('h4').textContent,
                    address: this.querySelector('p').textContent
                };
                localStorage.setItem('selectedLocation', JSON.stringify(selectedLocation));
            }
        });
    });
    
    // Time selection handler
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            selectedTime = this.textContent;
            localStorage.setItem('selectedTime', selectedTime);
        });
    });
    
    // Load any previously selected data
    const savedServices = localStorage.getItem('selectedServices');
    if (savedServices) selectedServices = JSON.parse(savedServices);
    
    const savedBarber = localStorage.getItem('selectedBarber');
    if (savedBarber) selectedBarber = JSON.parse(savedBarber);
    
    const savedLocation = localStorage.getItem('selectedLocation');
    if (savedLocation) selectedLocation = JSON.parse(savedLocation);
    
    const savedTime = localStorage.getItem('selectedTime');
    if (savedTime) selectedTime = savedTime;
});