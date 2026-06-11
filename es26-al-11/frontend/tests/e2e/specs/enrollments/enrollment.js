describe('Enrollment', () => {
  beforeEach(() => {
    cy.deleteAllButArs()
    cy.createDemoEntities();
    cy.createDatabaseInfoForEnrollments()
  });

  afterEach(() => {
    cy.deleteAllButArs()
  });

  it('create enrollment', () => {
    const MOTIVATION = 'I am very keen to help other people.';

    cy.intercept('POST', '/enrollments').as('enroll');
    cy.intercept('GET', '/activities/1/enrollments').as('enrollments');
    cy.intercept('GET', '/activities/1/shifts').as('shifts');


    // member login and check that there is activity with 0 enrollments
    cy.demoMemberLogin()
    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();
    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .should('have.length', 3)
      .eq(0)
      .children()
      .should('have.length', 14)
      .eq(4)
      .should('contain', 0)
    cy.logout();

    // volunteer login, creates enrollments selecting 2 of 3 shifts
    cy.demoVolunteerLogin()
    cy.get('[data-cy="volunteerActivities"]').click();
    cy.get('[data-cy="volunteerActivitiesTable"] tbody tr')
      .eq(0)
      .find('[data-cy="applyButton"]').click();
    cy.wait('@shifts');
    cy.get('[data-cy="motivationInput"]').type(MOTIVATION);
    // Open the shifts multi-select and select 2 shifts
    cy.get('[data-cy="shiftsSelect"]').click();
    // Wait for the dropdown menu to appear and verify 3 shifts
    cy.get('[role="listbox"] [role="option"]').should('have.length', 3);
    // Select first two shifts
    cy.get('[role="listbox"] [role="option"]').eq(0).click();
    cy.get('[role="listbox"] [role="option"]').eq(1).click();
    // Close the dropdown by pressing escape
    cy.get('body').type('{esc}');
    cy.get('[data-cy="saveEnrollment"]').click()
    cy.wait('@enroll')
    cy.logout()

    // member login and check that there is activity with 1 enrollment
    cy.demoMemberLogin()
    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();

    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .eq(0)
      .children()
      .eq(4)
      .should('contain', 1)

    // open enrollments view for first activity
    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .eq(0)
      .find('[data-cy="showEnrollments"]').click()
    cy.wait('@enrollments');
    // check that enrollment with correct motivation exists
    cy.get('[data-cy="activityEnrollmentsTable"] tbody tr')
      .first()
      .children()
      .eq(1)
      .should('contain', MOTIVATION)

    cy.logout();
  });

  it('cannot create enrollment with overlapping shifts', () => {
    const MOTIVATION = 'I am very keen to help other people.';

    cy.task('queryDatabase', {
      query: "UPDATE SHIFT SET end_time = start_time + INTERVAL '2 hour' WHERE id = 1",
      credentials: {
        user: Cypress.env('psql_db_username'),
        host: Cypress.env('psql_db_host'),
        database: Cypress.env('psql_db_name'),
        password: Cypress.env('psql_db_password'),
        port: Cypress.env('psql_db_port'),
      },
    });

    cy.task('queryDatabase', {
      query:
        "UPDATE SHIFT SET start_time = (SELECT start_time + INTERVAL '1 hour' FROM SHIFT WHERE id = 1), end_time = (SELECT end_time + INTERVAL '1 hour' FROM SHIFT WHERE id = 1) WHERE id = 10",
      credentials: {
        user: Cypress.env('psql_db_username'),
        host: Cypress.env('psql_db_host'),
        database: Cypress.env('psql_db_name'),
        password: Cypress.env('psql_db_password'),
        port: Cypress.env('psql_db_port'),
      },
    });

    cy.intercept('POST', '/enrollments').as('enroll');
    cy.intercept('GET', '/activities/1/shifts').as('shifts');

    cy.demoVolunteerLogin();
    cy.get('[data-cy="volunteerActivities"]').click();
    cy.get('[data-cy="volunteerActivitiesTable"] tbody tr')
      .eq(0)
      .find('[data-cy="applyButton"]').click();

    cy.wait('@shifts');
    cy.get('[data-cy="motivationInput"]').type(MOTIVATION);
    cy.get('[data-cy="shiftsSelect"]').click();
    cy.get('[role="listbox"] [role="option"]').eq(0).click();
    cy.get('[role="listbox"] [role="option"]').eq(1).click();
    cy.get('body').type('{esc}');

    cy.contains('Selected shifts cannot have overlapping periods').should(
      'be.visible',
    );
    cy.get('[data-cy="saveEnrollment"]').should('not.exist');
    cy.get('@enroll.all').should('have.length', 0);
  });

  it('update an enrollment', () => {
    const MOTIVATION2 = 'Motivation Example Two';
    
    // volunteer login and edit an errollment
    cy.demoVolunteerLogin()
    cy.get('[data-cy="volunteerEnrollments"]').click()
    cy.get('[data-cy="volunteerEnrollmentsTable"] tbody tr')
    .eq(0)
    .find('[data-cy="updateEnrollmentButton"]').click()
    
    cy.get('[data-cy="motivationInput"]').clear().type(MOTIVATION2);
    cy.get('[data-cy="saveEnrollment"]').click()
    cy.logout();

    // member check if the motivation is the new one
    cy.demoMemberLogin()
    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();

    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .eq(1)
      .find('[data-cy="showEnrollments"]').click()

    cy.get('[data-cy="activityEnrollmentsTable"] tbody tr')
    .eq(0)
    .children()
    .eq(1)
    .should('contain', MOTIVATION2)
    
    cy.logout();

  });

  it('delete an enrollment', () => {
    const ACTIVTIY_NAME_ONE = 'A2';

    // volunteer delete an enrollment
    cy.demoVolunteerLogin()
    cy.get('[data-cy="volunteerEnrollments"]').click()
    cy.get('[data-cy="volunteerEnrollmentsTable"] tbody tr')
    .eq(0)
    .children()
    .eq(0).should('contain', ACTIVTIY_NAME_ONE);

    cy.get('[data-cy="volunteerEnrollmentsTable"] tbody tr')
    .eq(0)
    .find('[data-cy="deleteEnrollmentButton"]').click();
    
    // check where is the actvity that volunteer delete enrollment and check that we can enroll again
    cy.get('[data-cy="volunteerActivities"]').click();
    cy.get('[data-cy="volunteerActivitiesTable"] tbody tr')
    .eq(1)
    .children()
    .eq(0)
    .should('contain', ACTIVTIY_NAME_ONE);

    cy.get('[data-cy="volunteerActivitiesTable"] tbody tr')
    .eq(1)
    .children()
    .eq(10)
    .find('[data-cy="applyButton"]')
    .should('exist');

    cy.logout();

    // member verify that this Activity don't have enrollments
    cy.demoMemberLogin()
    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();

    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .eq(1)
      .find('[data-cy="showEnrollments"]').click()
    
    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .should('have.length', 0)

    cy.logout();
    
  });
});