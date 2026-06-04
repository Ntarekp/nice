/** Role-based access for extinguisher records (facility ownership via createdBy). */

const canCreate = (user) => user?.role === "user";

const canUpdate = (user) => user?.role === "inspector";

const canDelete = () => false;

const canRead = (ext, user) => {
  if (!ext) return false;
  if (user?.role === "user") return ext.createdBy === user.sub;
  return true;
};

const applyListScope = (where, user, query = {}) => {
  if (user?.role === "user") {
    where.createdBy = user.sub;
  } else if (user?.role === "admin" && query.ownerId) {
    where.createdBy = query.ownerId;
  }
  return where;
};

module.exports = { canCreate, canUpdate, canDelete, canRead, applyListScope };
