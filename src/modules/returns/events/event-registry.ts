/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Contacto: softwarentalla@gmail.com
 * CEOs: 
 *       Persy Morell Guerra      Email: pmorellpersi@gmail.com  Phone : +53-5336-4654 Linkedin: https://www.linkedin.com/in/persy-morell-guerra-288943357/
 *       Dailyn García Domínguez  Email: dailyngd@gmail.com      Phone : +53-5432-0312 Linkedin: https://www.linkedin.com/in/dailyn-dominguez-3150799b/
 *
 * CTO: Persy Morell Guerra
 * COO: Dailyn García Domínguez and Persy Morell Guerra
 * CFO: Dailyn García Domínguez and Persy Morell Guerra
 *
 * Repositories: 
 *               https://github.com/SoftwareEnTalla 
 *
 *               https://github.com/apokaliptolesamale?tab=repositories
 *
 *
 * Social Networks:
 *
 *              https://x.com/SoftwarEnTalla
 *
 *              https://www.facebook.com/profile.php?id=61572625716568
 *
 *              https://www.instagram.com/softwarentalla/
 *              
 *
 *
 */


import { BaseEvent } from './base.event';
import { ReturnsCreatedEvent } from './returnscreated.event';
import { ReturnsUpdatedEvent } from './returnsupdated.event';
import { ReturnsDeletedEvent } from './returnsdeleted.event';
import { ReturnRequestedEvent } from './returnrequested.event';
import { ReturnApprovedEvent } from './returnapproved.event';
import { ReturnRejectedEvent } from './returnrejected.event';
import { ReturnRestockedEvent } from './returnrestocked.event';
import { RefundRequestedEvent } from './refundrequested.event';

export type RegisteredEventClass<T extends BaseEvent = BaseEvent> = new (
  aggregateId: string,
  payload: any
) => T;

export interface RegisteredEventDefinition<T extends BaseEvent = BaseEvent> {
  topic: string;
  eventName: string;
  version: string;
  eventClass: RegisteredEventClass<T>;
  retryTopic: string;
  dlqTopic: string;
  maxRetries: number;
  replayable: boolean;
}

const createEventDefinition = <T extends BaseEvent>(
  topic: string,
  eventClass: RegisteredEventClass<T>,
  overrides?: Partial<Omit<RegisteredEventDefinition<T>, 'topic' | 'eventName' | 'eventClass'>>,
): RegisteredEventDefinition<T> => ({
  topic,
  eventName: eventClass.name,
  version: overrides?.version ?? '1.0.0',
  eventClass,
  retryTopic: overrides?.retryTopic ?? topic + '-retry',
  dlqTopic: overrides?.dlqTopic ?? topic + '-dlq',
  maxRetries: overrides?.maxRetries ?? 3,
  replayable: overrides?.replayable ?? true,
});

const EVENT_DEFINITION_OVERRIDES: Partial<Record<string, Partial<Omit<RegisteredEventDefinition, 'topic' | 'eventName' | 'eventClass'>>>> = {
  'return-requested': {
    version: '1.0.0',
    maxRetries: 5,
    replayable: true,
  },
  'return-approved': {
    version: '1.0.0',
    maxRetries: 5,
    replayable: true,
  },
  'return-rejected': {
    version: '1.0.0',
    maxRetries: 5,
    replayable: true,
  },
  'return-restocked': {
    version: '1.0.0',
    maxRetries: 5,
    replayable: true,
  },
  'refund-requested': {
    version: '1.0.0',
    maxRetries: 5,
    replayable: true,
  },
};

export const EVENT_DEFINITIONS: Record<string, RegisteredEventDefinition> = {
  'returns-created': createEventDefinition('returns-created', ReturnsCreatedEvent, EVENT_DEFINITION_OVERRIDES['returns-created']),
  'returns-updated': createEventDefinition('returns-updated', ReturnsUpdatedEvent, EVENT_DEFINITION_OVERRIDES['returns-updated']),
  'returns-deleted': createEventDefinition('returns-deleted', ReturnsDeletedEvent, EVENT_DEFINITION_OVERRIDES['returns-deleted']),
  'return-requested': createEventDefinition('return-requested', ReturnRequestedEvent, EVENT_DEFINITION_OVERRIDES['return-requested']),
  'return-approved': createEventDefinition('return-approved', ReturnApprovedEvent, EVENT_DEFINITION_OVERRIDES['return-approved']),
  'return-rejected': createEventDefinition('return-rejected', ReturnRejectedEvent, EVENT_DEFINITION_OVERRIDES['return-rejected']),
  'return-restocked': createEventDefinition('return-restocked', ReturnRestockedEvent, EVENT_DEFINITION_OVERRIDES['return-restocked']),
  'refund-requested': createEventDefinition('refund-requested', RefundRequestedEvent, EVENT_DEFINITION_OVERRIDES['refund-requested']),
};

export const EVENT_REGISTRY: Record<string, RegisteredEventClass> = Object.fromEntries(
  Object.values(EVENT_DEFINITIONS).map((definition) => [definition.topic, definition.eventClass])
);

export const EVENT_TOPICS = Object.values(EVENT_DEFINITIONS).map((definition) => definition.topic);
export const EVENT_RETRY_TOPICS = Object.values(EVENT_DEFINITIONS).map((definition) => definition.retryTopic);
export const EVENT_DLQ_TOPICS = Object.values(EVENT_DEFINITIONS).map((definition) => definition.dlqTopic);
export const EVENT_CONSUMER_TOPICS = Array.from(new Set([...EVENT_TOPICS, ...EVENT_RETRY_TOPICS]));
export const EVENT_ADMIN_TOPICS = Array.from(new Set([...EVENT_TOPICS, ...EVENT_RETRY_TOPICS, ...EVENT_DLQ_TOPICS]));

export const resolveEventDefinition = (candidate?: string): RegisteredEventDefinition | undefined => {
  if (!candidate) {
    return undefined;
  }

  if (EVENT_DEFINITIONS[candidate]) {
    return EVENT_DEFINITIONS[candidate];
  }

  return Object.values(EVENT_DEFINITIONS).find(
    (definition) =>
      definition.topic === candidate ||
      definition.retryTopic === candidate ||
      definition.dlqTopic === candidate ||
      definition.eventName === candidate,
  );
};
