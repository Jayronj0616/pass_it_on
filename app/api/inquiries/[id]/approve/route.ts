// POST: donator approves an inquiry
// - verify caller owns the item this inquiry belongs to
// - set this inquiry -> approved, all other pending inquiries on same item -> closed
// - set item.status -> reserved
// See SYSTEM.md §5 and §6
