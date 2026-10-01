describe('Design Feedback Form E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/feedback');
  });

  it('should display the feedback page with all form elements', () => {
    cy.contains('h1', 'Design Feedback').should('be.visible');
    cy.contains('We value your design feedback').should('be.visible');

    cy.get('label').contains('First Name').should('be.visible');
    cy.get('label').contains('Last Name').should('be.visible');
    cy.get('label').contains('Email Address').should('be.visible');
    cy.get('label').contains('Feedback Category').should('be.visible');
    cy.get('label').contains('Design Feedback').should('be.visible');

    cy.get('button').contains('Submit Feedback').should('be.visible');
  });

  it('should show validation errors for empty submission', () => {
    cy.get('button').contains('Submit Feedback').click();

    cy.contains('First name is required').should('be.visible');
    cy.contains('Last name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
    cy.contains('Please select a feedback category').should('be.visible');
    cy.contains('Feedback comment is required').should('be.visible');
  });

  it('should validate first name field', () => {
    cy.get('input[placeholder="Enter your first name"]').type('J');
    cy.get('button').contains('Submit Feedback').click();

    cy.contains('First name must be 2-50 characters').should('be.visible');
  });

  it('should validate email field', () => {
    cy.get('input[placeholder="Enter your email"]').type('invalid-email');
    cy.get('button').contains('Submit Feedback').click();

    cy.contains('Please enter a valid email address').should('be.visible');
  });

  it('should validate feedback comment length', () => {
    cy.get('textarea[placeholder*="feedback"]').type('short');
    cy.get('button').contains('Submit Feedback').click();

    cy.contains('Feedback must be 10-1000 characters').should('be.visible');
  });

  it('should submit form with valid data and show success message', () => {
    cy.get('input[placeholder="Enter your first name"]').type('John');
    cy.get('input[placeholder="Enter your last name"]').type('Smith');
    cy.get('input[placeholder="Enter your email"]').type('john@example.com');
    cy.get('select').select('UI_DESIGN');
    cy.get('textarea[placeholder*="feedback"]').type('This is excellent design work!');

    cy.get('button').contains('Submit Feedback').click();

    cy.contains('Thank you for your feedback').should('be.visible');
  });

  it('should clear form after successful submission', () => {
    cy.get('input[placeholder="Enter your first name"]').type('John');
    cy.get('input[placeholder="Enter your last name"]').type('Smith');
    cy.get('input[placeholder="Enter your email"]').type('john@example.com');
    cy.get('select').select('UI_DESIGN');
    cy.get('textarea[placeholder*="feedback"]').type('This is excellent design work!');

    cy.get('button').contains('Submit Feedback').click();

    cy.get('input[placeholder="Enter your first name"]').should('have.value', '');
    cy.get('input[placeholder="Enter your last name"]').should('have.value', '');
    cy.get('input[placeholder="Enter your email"]').should('have.value', '');
    cy.get('select').should('have.value', '');
    cy.get('textarea[placeholder*="feedback"]').should('have.value', '');
  });

  it('should support keyboard navigation', () => {
    cy.get('input[placeholder="Enter your first name"]')
      .focus()
      .type('John');
    cy.tab();
    cy.focused().type('Smith');
    cy.tab();
    cy.focused().type('john@example.com');
    cy.tab();
    cy.focused().select('UI_DESIGN');
    cy.tab();
    cy.focused().type('This is excellent feedback message');
    cy.tab();
    cy.focused().type('{enter}');

    cy.contains('Thank you for your feedback').should('be.visible');
  });

  it('should show character count in feedback textarea', () => {
    const feedbackText = 'This is a test feedback';
    cy.get('textarea[placeholder*="feedback"]').type(feedbackText);

    cy.contains(`${feedbackText.length} / 1000 characters`).should('be.visible');
  });

  it('should be responsive on mobile devices', () => {
    cy.viewport('iphone-x');

    cy.contains('h1', 'Design Feedback').should('be.visible');
    cy.get('input[placeholder="Enter your first name"]').should('be.visible');
    cy.get('button').contains('Submit Feedback').should('be.visible');

    // Form should be usable on mobile
    cy.get('input[placeholder="Enter your first name"]').type('John');
    cy.get('input[placeholder="Enter your last name"]').type('Smith');
    cy.get('input[placeholder="Enter your email"]').type('john@example.com');
    cy.get('select').select('UI_DESIGN');
    cy.get('textarea[placeholder*="feedback"]').type('Mobile feedback test');

    cy.get('button').contains('Submit Feedback').click();

    cy.contains('Thank you for your feedback').should('be.visible');
  });

  it('should be accessible via screen reader', () => {
    // Check for proper labels and ARIA attributes
    cy.get('input[placeholder="Enter your first name"]')
      .should('have.attr', 'aria-invalid', 'false');

    cy.get('select')
      .should('have.attr', 'aria-invalid', 'false');

    // Success message should be announced
    cy.get('input[placeholder="Enter your first name"]').type('John');
    cy.get('input[placeholder="Enter your last name"]').type('Smith');
    cy.get('input[placeholder="Enter your email"]').type('john@example.com');
    cy.get('select').select('UI_DESIGN');
    cy.get('textarea[placeholder*="feedback"]').type('Accessibility test');

    cy.get('button').contains('Submit Feedback').click();

    cy.get('[role="alert"]').should('contain', 'Thank you for your feedback');
  });

  it('should display all 6 feedback categories in dropdown', () => {
    cy.get('select').click();

    cy.contains('UI Design').should('be.visible');
    cy.contains('User Experience').should('be.visible');
    cy.contains('Accessibility').should('be.visible');
    cy.contains('Navigation').should('be.visible');
    cy.contains('Visual Issues').should('be.visible');
    cy.contains('Suggestions').should('be.visible');
  });

  it('should auto-dismiss success message', () => {
    cy.get('input[placeholder="Enter your first name"]').type('John');
    cy.get('input[placeholder="Enter your last name"]').type('Smith');
    cy.get('input[placeholder="Enter your email"]').type('john@example.com');
    cy.get('select').select('UI_DESIGN');
    cy.get('textarea[placeholder*="feedback"]').type('This is excellent design work!');

    cy.get('button').contains('Submit Feedback').click();

    cy.contains('Thank you for your feedback').should('be.visible');

    // Wait for auto-dismiss (4 seconds)
    cy.contains('Thank you for your feedback', { timeout: 5000 }).should(
      'not.exist',
    );
  });
});
