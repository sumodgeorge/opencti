/* eslint-disable camelcase,no-case-declarations */
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import * as R from 'ramda';
import jsonCanonicalize from 'canonicalize';
import { DatabaseError, UnsupportedError } from '../config/errors';
import { convertEntityTypeToStixType } from './schemaUtils';
import * as I from './internalObject';
import * as D from './stixDomainObject';
import * as M from './stixMetaObject';
import * as C from './stixCyberObservableObject';
import { BASE_TYPE_RELATION, OASIS_NAMESPACE, OPENCTI_NAMESPACE, OPENCTI_PLATFORM_UUID } from './general';
import { isStixMetaObject } from './stixMetaObject';
import { isStixDomainObject } from './stixDomainObject';
import { isStixCyberObservable } from './stixCyberObservableObject';
import { isInternalObject } from './internalObject';
import { isInternalRelationship } from './internalRelationship';
import { isStixCoreRelationship } from './stixCoreRelationship';
import { isStixMetaRelationship } from './stixMetaRelationship';
import { isStixSightingRelationship } from './stixSightingRelationship';
import { isStixCyberObservableRelationship } from './stixCyberObservableRelationship';

export const normalizeName = (name) => {
  return (name || '').toLowerCase().trim();
};
const idGen = (data, namespace) => {
  // If element have nothing participating to the key, we can only create an uuidv4
  if (R.isEmpty(data)) return uuidv4();
  const dataCanonicalize = jsonCanonicalize(data);
  return uuidv5(dataCanonicalize, namespace);
};

const stixCyberObservableContribution = {
  definition: {
    // Observables
    [C.ENTITY_AUTONOMOUS_SYSTEM]: [{ src: 'number' }],
    [C.ENTITY_DIRECTORY]: [{ src: 'name' }],
    [C.ENTITY_DOMAIN_NAME]: [{ src: 'value' }],
    [C.ENTITY_EMAIL_ADDR]: [{ src: 'value' }],
    [C.ENTITY_EMAIL_MESSAGE]: [{ src: 'from', dest: 'from_ref' }, { src: 'subject' }, { src: 'body' }],
    [C.ENTITY_HASHED_OBSERVABLE_ARTIFACT]: [{ src: 'hashes' }],
    [C.ENTITY_HASHED_OBSERVABLE_STIX_FILE]: [{ src: 'hashes' }],
    [C.ENTITY_HASHED_OBSERVABLE_X509_CERTIFICATE]: [{ src: 'hashes' }],
    [C.ENTITY_IPV4_ADDR]: [{ src: 'value' }],
    [C.ENTITY_IPV6_ADDR]: [{ src: 'value' }],
    [C.ENTITY_MAC_ADDR]: [{ src: 'value' }],
    [C.ENTITY_MUTEX]: [{ src: 'name' }],
    [C.ENTITY_NETWORK_TRAFFIC]: [
      { src: 'start' },
      { src: 'src', dest: 'src_ref' },
      { src: 'dst', dest: 'dst_ref' },
      { src: 'src_port' },
      { src: 'dst_port' },
      { src: 'protocols' },
    ],
    [C.ENTITY_PROCESS]: [{ src: 'stix_id' }],
    [C.ENTITY_SOFTWARE]: [{ src: 'name' }, { src: 'cpe' }, { src: 'vendor' }, { src: 'version' }],
    [C.ENTITY_URL]: [{ src: 'name' }],
    [C.ENTITY_USER_ACCOUNT]: [{ src: 'account_type' }, { src: 'user_id' }, { src: 'account_login' }],
    [C.ENTITY_WINDOWS_REGISTRY_KEY]: [{ src: 'key' }, { src: 'values' }],
    [C.ENTITY_X_OPENCTI_CRYPTOGRAPHIC_KEY]: [{ src: 'value' }],
    [C.ENTITY_X_OPENCTI_CRYPTOGRAPHIC_WALLET]: [{ src: 'value' }],
    [C.ENTITY_X_OPENCTI_HOSTNAME]: [{ src: 'value' }],
    [C.ENTITY_X_OPENCTI_USER_AGENT]: [{ src: 'value' }],
    [C.ENTITY_X_OPENCTI_TEXT]: [{ src: 'value' }],
    // Types embedded
    [C.ENTITY_EMAIL_MIME_PART_TYPE]: [], // ALL
    [C.ENTITY_X509_V3_EXTENSIONS_TYPE]: [], // ALL
    [C.ENTITY_WINDOWS_REGISTRY_VALUE_TYPE]: [], // ALL
  },
  resolvers: {
    from(from) {
      return from?.standard_id;
    },
    src(src) {
      return src?.standard_id;
    },
    dst(dst) {
      return dst?.standard_id;
    },
    hashes(data) {
      if (data.MD5) return { MD5: data.MD5 };
      if (data['SHA-1']) return { 'SHA-1': data['SHA-1'] };
      if (data['SHA-256']) return { 'SHA-256': data['SHA-256'] };
      if (data['SHA-512']) return { 'SHA-512': data['SHA-512'] };
      return undefined;
    },
  },
};
const stixEntityContribution = {
  definition: {
    // Internal
    [I.ENTITY_TYPE_SETTINGS]: OPENCTI_PLATFORM_UUID,
    [I.ENTITY_TYPE_MIGRATION_STATUS]: [], // ALL
    [I.ENTITY_TYPE_MIGRATION_REFERENCE]: [], // ALL
    [I.ENTITY_TYPE_TOKEN]: [{ src: 'uuid' }],
    [I.ENTITY_TYPE_GROUP]: [{ src: 'name' }],
    [I.ENTITY_TYPE_USER]: [{ src: 'user_email' }],
    [I.ENTITY_TYPE_ROLE]: [{ src: 'name' }],
    [I.ENTITY_TYPE_CAPABILITY]: [{ src: 'name' }],
    [I.ENTITY_TYPE_CONNECTOR]: [{ src: 'name' }],
    [I.ENTITY_TYPE_WORKSPACE]: [{ src: 'name' }, { src: 'workspace_type' }],
    // Stix Domain
    [D.ENTITY_TYPE_ATTACK_PATTERN]: [{ src: 'name' }, { src: 'x_mitre_id' }],
    [D.ENTITY_TYPE_CAMPAIGN]: [{ src: 'name' }],
    [D.ENTITY_TYPE_CONTAINER_NOTE]: [{ src: 'stix_id' }],
    [D.ENTITY_TYPE_CONTAINER_OBSERVED_DATA]: [
      { src: 'first_observed' },
      { src: 'last_observed' },
      { src: 'number_observed' },
    ],
    [D.ENTITY_TYPE_CONTAINER_OPINION]: [{ src: 'stix_id' }],
    [D.ENTITY_TYPE_CONTAINER_REPORT]: [{ src: 'name' }, { src: 'published' }],
    [D.ENTITY_TYPE_COURSE_OF_ACTION]: [{ src: 'name' }, { src: 'x_mitre_id' }],
    [D.ENTITY_TYPE_IDENTITY_INDIVIDUAL]: [{ src: 'name' }],
    [D.ENTITY_TYPE_IDENTITY_ORGANIZATION]: [{ src: 'name' }],
    [D.ENTITY_TYPE_IDENTITY_SECTOR]: [{ src: 'name' }],
    [D.ENTITY_TYPE_INDICATOR]: [{ src: 'pattern' }],
    [D.ENTITY_TYPE_INFRASTRUCTURE]: [{ src: 'name' }],
    [D.ENTITY_TYPE_INTRUSION_SET]: [{ src: 'name' }],
    [D.ENTITY_TYPE_LOCATION_CITY]: [{ src: 'name' }],
    [D.ENTITY_TYPE_LOCATION_COUNTRY]: [{ src: 'name' }],
    [D.ENTITY_TYPE_LOCATION_REGION]: [{ src: 'name' }],
    [D.ENTITY_TYPE_LOCATION_POSITION]: [{ src: 'latitude' }, { src: 'longitude' }],
    [D.ENTITY_TYPE_MALWARE]: [{ src: 'name' }],
    [D.ENTITY_TYPE_THREAT_ACTOR]: [{ src: 'name' }],
    [D.ENTITY_TYPE_TOOL]: [{ src: 'name' }],
    [D.ENTITY_TYPE_VULNERABILITY]: [{ src: 'name' }],
    [D.ENTITY_TYPE_X_OPENCTI_INCIDENT]: [{ src: 'name' }],
    // Stix Meta
    [M.ENTITY_TYPE_MARKING_DEFINITION]: [{ src: 'definition' }, { src: 'definition_type' }],
    [M.ENTITY_TYPE_LABEL]: [{ src: 'value' }],
    [M.ENTITY_TYPE_KILL_CHAIN_PHASE]: [{ src: 'phase_name' }, { src: 'kill_chain_name' }],
    [M.ENTITY_TYPE_EXTERNAL_REFERENCE]: [[{ src: 'url' }], [{ src: 'source_name' }, { src: 'external_id' }]],
  },
  resolvers: {
    name(data) {
      return normalizeName(data);
    },
    published(data) {
      return data instanceof Date ? data.toISOString() : data;
    },
    first_observed(data) {
      return data instanceof Date ? data.toISOString() : data;
    },
    last_observed(data) {
      return data instanceof Date ? data.toISOString() : data;
    },
  },
};
const resolveContribution = (type) => {
  return isStixCyberObservable(type) ? stixCyberObservableContribution : stixEntityContribution;
};
export const isFieldContributingToStandardId = (instance, keys) => {
  const instanceType = instance.entity_type;
  const isRelation = instance.base_type === BASE_TYPE_RELATION;
  if (isRelation) return false;
  const contrib = resolveContribution(instanceType);
  const properties = contrib.definition[instanceType];
  if (!properties) {
    throw DatabaseError(`Unknown definition for type ${instanceType}`);
  }
  if (properties.length === 0) return true;
  const targetKeys = R.map((k) => (k.includes('.') ? R.head(k.split('.')) : k), keys);
  const propertiesToKeep = R.flatten(R.map((t) => t.src, properties));
  const keysIncluded = R.filter((p) => R.includes(p, targetKeys), propertiesToKeep);
  return keysIncluded.length > 0;
};
const filteredIdContributions = (contrib, way, data) => {
  const propertiesToKeep = R.flatten(R.map((t) => t.src, way));
  const dataRelated = R.pick(propertiesToKeep, data);
  if (R.isEmpty(dataRelated)) return {};
  const objectData = {};
  const entries = Object.entries(dataRelated);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const [key, value] = entry;
    const prop = R.find((e) => R.includes(key, e.src), way);
    const { src, dest } = prop;
    const destKey = dest || src;
    const resolver = contrib.resolvers[src];
    if (resolver) {
      objectData[destKey] = value ? resolver(value) : value;
    } else {
      objectData[destKey] = value;
    }
  }
  return R.filter((keyValue) => !R.isEmpty(keyValue) && !R.isNil(keyValue), objectData);
};

const generateDataUUID = (type, data) => {
  const contrib = resolveContribution(type);
  const properties = contrib.definition[type];
  if (!properties) {
    throw DatabaseError(`Unknown definition for type ${type}`);
  }
  if (properties.length === 0) return data;
  // Handle specific case of static uuid
  if (!Array.isArray(properties)) return properties;
  // In same case ID have multiple possibility for his generation.
  let uuidData;
  const haveDiffWays = Array.isArray(R.head(properties));
  if (haveDiffWays) {
    for (let index = 0; index < properties.length; index += 1) {
      const way = properties[index];
      // eslint-disable-next-line no-await-in-loop
      uuidData = filteredIdContributions(contrib, way, data);
      if (!R.isEmpty(uuidData)) break; // Stop as soon as a correct id is find
    }
  } else {
    uuidData = filteredIdContributions(contrib, properties, data);
  }
  return uuidData;
};
const generateStixUUID = (type, data) => {
  const dataUUID = generateDataUUID(type, data);
  return idGen(dataUUID, OASIS_NAMESPACE);
};
const generateObjectUUID = (type, data) => {
  const dataUUID = generateDataUUID(type, data);
  return idGen(dataUUID, OPENCTI_NAMESPACE);
};

const generateObjectId = (type, data) => {
  const uuid = generateObjectUUID(type, data);
  return `${convertEntityTypeToStixType(type)}--${uuid}`;
};
const generateStixId = (type, data) => {
  const uuid = generateStixUUID(type, data);
  return `${convertEntityTypeToStixType(type)}--${uuid}`;
};

export const generateInternalId = () => uuidv4();
export const generateWorkId = () => `opencti-work--${generateInternalId()}`;
export const generateStandardId = (type, data) => {
  // Entities
  if (isStixMetaObject(type)) return generateStixId(type, data);
  if (isStixDomainObject(type)) return generateStixId(type, data);
  if (isStixCyberObservable(type)) return generateStixId(type, data);
  if (isInternalObject(type)) return generateObjectId(type, data);
  // Relations
  if (isInternalRelationship(type)) return `internal-relationship--${generateInternalId()}`;
  if (isStixCoreRelationship(type)) return `relationship--${generateInternalId()}`;
  if (isStixMetaRelationship(type)) return `relationship-meta--${generateInternalId()}`;
  if (isStixCyberObservableRelationship(type)) return `relationship-meta--${generateInternalId()}`;
  if (isStixSightingRelationship(type)) return `sighting--${generateInternalId()}`;
  // Unknown
  throw UnsupportedError(`${type} is not supported by the platform`);
};
export const generateAliasesId = (aliases) => {
  return R.map((a) => {
    const uuid = idGen({ name: normalizeName(a) }, OPENCTI_NAMESPACE);
    return `aliases--${uuid}`;
  }, aliases);
};
