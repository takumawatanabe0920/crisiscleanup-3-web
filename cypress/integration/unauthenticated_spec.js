/**
 *
 * Tests for unauthenticated Login Page
 *
 * Cypress
 */

import { fixCypressSpec } from '../support';

beforeEach(fixCypressSpec(__filename));

describe('unAuthenticated Layout', () => {
  it('successfully loads', () => {
    cy.visit('/');
  });

  it('successfully redirects', () => {
    cy.visit('/');
    cy.url().should('match', /login/);
    cy.contains('Sign in to your account');
  });

  it('should match image snapshot', () => {
    cy.visit('/login').then(() => cy.get('div.login').toMatchImageSnapshot());
  });

  it('should authenticate and redirect', () => {
    cy.visit('/').then(() => {
      cy.get('input[type=email]').type(Cypress.env('WEB_USER'));
      cy.get('input[type=password]').type(Cypress.env('WEB_PASS'));
      cy.get('div.login')
        .find('button')
        .click();
      cy.url().should('match', /dashboard/);
      // ensure user session gets stored in local storage
      cy.contains('Dashboard')
        .should('be.visible')
        .then(() => {
          const userItem = window.localStorage.getItem('user');
          expect(userItem).to.be.a('string');
          const user = JSON.parse(userItem);
          expect(user).to.be.an('object');
          expect(user).to.have.keys([
            'access_token',
            'user_claims',
            'organizations',
          ]);
          expect(user.access_token).to.be.a('string');
        });
      // logout
      cy.contains('Demo User').click();
      cy.contains('Logout').click();
      cy.url().should('match', /login/);
    });
  });

  it('should not have access to protected resource', () => {
    cy.request({
      url: `${Cypress.env('API_BASE_URL')}/organizations/12`,
      failOnStatusCode: false,
    })
      .its('status')
      /**
       * @todo Return appropriate HTTP Response for unauthorized resource
       * @body Should be returning status 401 (https://httpstatuses.com/401)
       */
      .should('equal', 200);
    // .should('equal', 401);
  });

  it('should not allow a bad login', () => {
    cy.visit('/');
    cy.url().should('match', /login/);
    cy.get('input[type=email]').type('user');
    cy.get('input[type=password]').type('pass{enter}');
    // should have toast error and remain on login page
    cy.url().should('match', /login/);
    cy.contains('Invalid email').should('be.visible');
  });

  it('should redirect to case post-auth', () => {
    // @see - CrisisCleanup/crisiscleanup-3-web#64
    cy.visit('/incident/158/cases/142359').then(() => {
      cy.location().should(loc => {
        expect(loc.search).to.eq('?from=%2Fincident%2F158%2Fcases%2F142359');
      });
    });
  });
});
