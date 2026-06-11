describe('Shift', () => {
  beforeEach(() => {
    cy.deleteAllButArs();
    cy.createDemoEntities();
    cy.createDatabaseInfoForShifts();
  });

  afterEach(() => {
    cy.deleteAllButArs();
  });

  it('create shift', () => {
    const PARTICIPANTS_LIMIT = '2';
    const LOCATION = 'Avenida da Liberdade 100, Lisboa';

    // Ensure a deterministic valid case: future dates and within activity range.
    const validStart = new Date();
    validStart.setDate(validStart.getDate() + 2);
    validStart.setHours(10, 0, 0, 0);
    const validEnd = new Date(validStart);
    validEnd.setHours(12, 0, 0, 0);

    const validStartIso = validStart.toISOString().replace('.000Z', '+00:00');
    const validEndIso = validEnd.toISOString().replace('.000Z', '+00:00');

    cy.intercept('GET', '/users/*/getInstitution').as('getInstitution');
    cy.intercept('GET', '/activities/1/shifts').as('getShifts');
    cy.intercept('POST', '/activities/1/shift', (req) => {
      req.body.startTime = validStartIso;
      req.body.endTime = validEndIso;
    }).as('createShift');

    cy.demoMemberLogin();

    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();
    cy.wait('@getInstitution');

    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .should('have.length', 1)
      .eq(0)
      .find('[data-cy="showShifts"]')
      .click();

    cy.wait('@getShifts');

    cy.get('[data-cy="newShift"]').click();

    cy.get('#startTimeInput-input').click();
    cy.get('#startTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(1)
      .click({ force: true });

    cy.get('#endTimeInput-input').click();
    cy.get('#endTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(2)
      .click({ force: true });

    cy.get('[data-cy="participantsLimitInput"]').type(PARTICIPANTS_LIMIT);
    cy.get('[data-cy="locationInput"]').type(LOCATION);

    cy.get('[data-cy="saveShift"]').should('not.be.disabled').click();

    cy.wait('@createShift').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });

    cy.get('[data-cy="activityShiftsTable"] tbody tr')
      .should('have.length', 1)
      .eq(0)
      .children()
      .should('have.length', 4);

    cy.get('[data-cy="activityShiftsTable"] tbody tr')
      .eq(0)
      .children()
      .eq(2)
      .should('contain', LOCATION);

    cy.get('[data-cy="activityShiftsTable"] tbody tr')
      .eq(0)
      .children()
      .eq(3)
      .should('contain', PARTICIPANTS_LIMIT);
  });

  it('new shift button disabled when activity is not approved', () => {
    cy.intercept('GET', '/users/*/getInstitution', (req) => {
      req.continue((res) => {
        if (res.body && res.body.activities && res.body.activities.length > 0) {
          res.body.activities[0].state = 'SUSPENDED';
        }
      });
    }).as('getInstitutionWithSuspendedActivity');
    cy.intercept('GET', '/activities/1/shifts').as('getShifts');

    cy.demoMemberLogin();

    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();
    cy.wait('@getInstitutionWithSuspendedActivity');

    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .should('have.length', 1)
      .eq(0)
      .find('[data-cy="showShifts"]')
      .click();

    cy.wait('@getShifts');

    cy.get('[data-cy="newShift"]').should('be.disabled');
  });

  it('save button disabled when location has less than 20 characters', () => {
    const PARTICIPANTS_LIMIT = '2';
    const SHORT_LOCATION = 'Short'; // Less than 20 characters

    cy.intercept('GET', '/users/*/getInstitution').as('getInstitution');
    cy.intercept('GET', '/activities/1/shifts').as('getShifts');

    cy.demoMemberLogin();

    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();
    cy.wait('@getInstitution');

    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .should('have.length', 1)
      .eq(0)
      .find('[data-cy="showShifts"]')
      .click();

    cy.wait('@getShifts');

    cy.get('[data-cy="newShift"]').click();

    cy.get('#startTimeInput-input').click();
    cy.get('#startTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(1)
      .click({ force: true });

    cy.get('#endTimeInput-input').click();
    cy.get('#endTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(2)
      .click({ force: true });

    cy.get('[data-cy="participantsLimitInput"]').type(PARTICIPANTS_LIMIT);
    cy.get('[data-cy="locationInput"]').type(SHORT_LOCATION);

    cy.get('[data-cy="saveShift"]').should('be.disabled');
  });

  it('save button disabled when location has more than 200 characters', () => {
    const PARTICIPANTS_LIMIT = '2';
    const LONG_LOCATION = 'a'.repeat(201); // More than 200 characters

    cy.intercept('GET', '/users/*/getInstitution').as('getInstitution');
    cy.intercept('GET', '/activities/1/shifts').as('getShifts');

    cy.demoMemberLogin();

    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();
    cy.wait('@getInstitution');

    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .should('have.length', 1)
      .eq(0)
      .find('[data-cy="showShifts"]')
      .click();

    cy.wait('@getShifts');

    cy.get('[data-cy="newShift"]').click();

    cy.get('#startTimeInput-input').click();
    cy.get('#startTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(1)
      .click({ force: true });

    cy.get('#endTimeInput-input').click();
    cy.get('#endTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(2)
      .click({ force: true });

    cy.get('[data-cy="participantsLimitInput"]').type(PARTICIPANTS_LIMIT);
    cy.get('[data-cy="locationInput"]').type(LONG_LOCATION);

    cy.get('[data-cy="saveShift"]').should('be.disabled');
  });

  it('save button enabled when location has between 20 and 200 characters', () => {
    const PARTICIPANTS_LIMIT = '2';
    const VALID_LOCATION = 'Valid Location with exactly twenty characters!'; // Between 20-200 chars

    cy.intercept('GET', '/users/*/getInstitution').as('getInstitution');
    cy.intercept('GET', '/activities/1/shifts').as('getShifts');

    cy.demoMemberLogin();

    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();
    cy.wait('@getInstitution');

    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .should('have.length', 1)
      .eq(0)
      .find('[data-cy="showShifts"]')
      .click();

    cy.wait('@getShifts');

    cy.get('[data-cy="newShift"]').click();

    cy.get('#startTimeInput-input').click();
    cy.get('#startTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(1)
      .click({ force: true });

    cy.get('#endTimeInput-input').click();
    cy.get('#endTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(2)
      .click({ force: true });

    cy.get('[data-cy="participantsLimitInput"]').type(PARTICIPANTS_LIMIT);
    cy.get('[data-cy="locationInput"]').type(VALID_LOCATION);

    cy.get('[data-cy="saveShift"]').should('not.be.disabled');
  });

  it('error when start time is after end time', () => {
    const PARTICIPANTS_LIMIT = '2';
    const LOCATION = 'Avenida da Liberdade 100, Lisboa';

    // Create dates where start time is AFTER end time (invalid)
    const invalidEnd = new Date();
    invalidEnd.setDate(invalidEnd.getDate() + 2);
    invalidEnd.setHours(10, 0, 0, 0);
    const invalidStart = new Date(invalidEnd);
    invalidStart.setHours(14, 0, 0, 0); // Start is 4 hours AFTER end

    const invalidStartIso = invalidStart.toISOString().replace('.000Z', '+00:00');
    const invalidEndIso = invalidEnd.toISOString().replace('.000Z', '+00:00');

    cy.intercept('GET', '/users/*/getInstitution').as('getInstitution');
    cy.intercept('GET', '/activities/1/shifts').as('getShifts');

    // Intercept and force the backend to receive invalid dates
    cy.intercept('POST', '/activities/1/shift', (req) => {
      // Modify request body to have start time AFTER end time
      req.body = {
        ...req.body,
        startTime: invalidStartIso,
        endTime: invalidEndIso
      };
    }).as('createShiftError');

    cy.demoMemberLogin();

    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();
    cy.wait('@getInstitution');

    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .should('have.length', 1)
      .eq(0)
      .find('[data-cy="showShifts"]')
      .click();

    cy.wait('@getShifts');

    cy.get('[data-cy="newShift"]').click();

    // Fill in valid UI inputs (doesn't matter since we intercept)
    cy.get('#startTimeInput-input').click();
    cy.get('#startTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(1)
      .click({ force: true });

    cy.get('#endTimeInput-input').click();
    cy.get('#endTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(2)
      .click({ force: true });

    cy.get('[data-cy="participantsLimitInput"]').type(PARTICIPANTS_LIMIT);
    cy.get('[data-cy="locationInput"]').type(LOCATION);

    cy.get('[data-cy="saveShift"]').click();

    // Verify the backend rejects the invalid dates
    cy.wait('@createShiftError').then((interception) => {
      // Backend should return error status for invalid dates (start time after end time)
      expect(interception.response?.statusCode).to.be.oneOf([400, 500]);
    });
  });

  it('error when shift dates are outside activity dates', () => {
    const PARTICIPANTS_LIMIT = '2';
    const LOCATION = 'Avenida da Liberdade 100, Lisboa';

    // Activity in test data ends in ~30 days, so the shift is intentionally out of range.
    const invalidStart = new Date();
    invalidStart.setDate(invalidStart.getDate() + 40);
    invalidStart.setHours(10, 0, 0, 0);
    const invalidEnd = new Date(invalidStart);
    invalidEnd.setHours(12, 0, 0, 0);

    const invalidStartIso = invalidStart.toISOString().replace('.000Z', '+00:00');
    const invalidEndIso = invalidEnd.toISOString().replace('.000Z', '+00:00');

    cy.intercept('GET', '/users/*/getInstitution').as('getInstitution');
    cy.intercept('GET', '/activities/1/shifts').as('getShifts');
    cy.intercept('POST', '/activities/1/shift', (req) => {
      req.body = {
        ...req.body,
        startTime: invalidStartIso,
        endTime: invalidEndIso,
      };
    }).as('createShiftOutOfBoundsError');

    cy.demoMemberLogin();

    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();
    cy.wait('@getInstitution');

    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .should('have.length', 1)
      .eq(0)
      .find('[data-cy="showShifts"]')
      .click();

    cy.wait('@getShifts');

    cy.get('[data-cy="newShift"]').click();

    // Fill in valid UI inputs; request is overridden to out-of-range dates.
    cy.get('#startTimeInput-input').click();
    cy.get('#startTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(1)
      .click({ force: true });

    cy.get('#endTimeInput-input').click();
    cy.get('#endTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(2)
      .click({ force: true });

    cy.get('[data-cy="participantsLimitInput"]').type(PARTICIPANTS_LIMIT);
    cy.get('[data-cy="locationInput"]').type(LOCATION);

    cy.get('[data-cy="saveShift"]').should('not.be.disabled').click();

    cy.wait('@createShiftOutOfBoundsError').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([400, 500]);
    });

    cy.get('.v-alert').should('be.visible').and('contain', 'Error:');

    // Failed creation must not add the shift to the table.
    cy.get('[data-cy="activityShiftsTable"]').should('not.contain', LOCATION);
  });

  it('error when sum of shift participant limits exceeds activity participant limit', () => {
    const FIRST_SHIFT_LIMIT = '4';
    const SECOND_SHIFT_LIMIT = '2';
    const FIRST_LOCATION = 'Avenida da Liberdade 100, Lisboa';
    const SECOND_LOCATION = 'Rua Augusta 101, Lisboa, Portugal';

    // Activity created by seed has participants limit 5.
    // First creation (4) succeeds, second (2) should exceed total and fail.
    const firstStart = new Date();
    firstStart.setDate(firstStart.getDate() + 2);
    firstStart.setHours(10, 0, 0, 0);
    const firstEnd = new Date(firstStart);
    firstEnd.setHours(12, 0, 0, 0);

    const secondStart = new Date();
    secondStart.setDate(secondStart.getDate() + 3);
    secondStart.setHours(10, 0, 0, 0);
    const secondEnd = new Date(secondStart);
    secondEnd.setHours(12, 0, 0, 0);

    const firstStartIso = firstStart.toISOString().replace('.000Z', '+00:00');
    const firstEndIso = firstEnd.toISOString().replace('.000Z', '+00:00');
    const secondStartIso = secondStart.toISOString().replace('.000Z', '+00:00');
    const secondEndIso = secondEnd.toISOString().replace('.000Z', '+00:00');

    let createShiftCallCount = 0;

    cy.intercept('GET', '/users/*/getInstitution').as('getInstitution');
    cy.intercept('GET', '/activities/1/shifts').as('getShifts');
    cy.intercept('POST', '/activities/1/shift', (req) => {
      createShiftCallCount += 1;
      if (createShiftCallCount === 1) {
        req.body.startTime = firstStartIso;
        req.body.endTime = firstEndIso;
      } else {
        req.body.startTime = secondStartIso;
        req.body.endTime = secondEndIso;
      }
    }).as('createShift');

    cy.demoMemberLogin();

    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();
    cy.wait('@getInstitution');

    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .should('have.length', 1)
      .eq(0)
      .find('[data-cy="showShifts"]')
      .click();

    cy.wait('@getShifts');

    // Create first shift successfully.
    cy.get('[data-cy="newShift"]').click();

    cy.get('#startTimeInput-input').click();
    cy.get('#startTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(1)
      .click({ force: true });

    cy.get('#endTimeInput-input').click();
    cy.get('#endTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(2)
      .click({ force: true });

    cy.get('[data-cy="participantsLimitInput"]').type(FIRST_SHIFT_LIMIT);
    cy.get('[data-cy="locationInput"]').type(FIRST_LOCATION);
    cy.get('[data-cy="saveShift"]').should('not.be.disabled').click();

    cy.wait('@createShift').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });

    cy.get('[data-cy="activityShiftsTable"] tbody tr').should('have.length', 1);

    // Create second shift and expect backend validation error.
    cy.get('[data-cy="newShift"]').click();

    cy.get('#startTimeInput-input').click();
    cy.get('#startTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(2)
      .click({ force: true });

    cy.get('#endTimeInput-input').click();
    cy.get('#endTimeInput-wrapper.date-time-picker')
      .find('.datepicker-day-text')
      .eq(3)
      .click({ force: true });

    cy.get('[data-cy="participantsLimitInput"]').type(SECOND_SHIFT_LIMIT);
    cy.get('[data-cy="locationInput"]').type(SECOND_LOCATION);
    cy.get('[data-cy="saveShift"]').should('not.be.disabled').click();

    cy.wait('@createShift').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([400, 500]);
      expect(interception.response?.body?.message).to.contain(
        'Total participants of shifts exceeds activity limit',
      );
    });

    cy.get('.v-alert')
      .should('be.visible')
      .and('contain', 'Total participants of shifts exceeds activity limit');

    cy.get('[data-cy="activityShiftsTable"]').should('not.contain', SECOND_LOCATION);
  });
});
