// Jest: dat mui gio TRUOC khi tao worker (doi process.env.TZ trong file test khong co tac dung).
// Gio Viet Nam giong may cua sinh vien/giang vien; doi bang bien TC_TZ neu can.
module.exports = async () => {
  process.env.TZ = process.env.TC_TZ || 'Asia/Ho_Chi_Minh';
};
