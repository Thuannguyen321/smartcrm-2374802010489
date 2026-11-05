function createCatalogService({ db, catalogRepo }) {
  return {
    listCategories: () => catalogRepo.listCategories(db),
    listProducts: () => catalogRepo.listProducts(db),
  };
}

module.exports = { createCatalogService };
