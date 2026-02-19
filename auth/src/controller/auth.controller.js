const usermodel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("../db/redis");
const { publishToQueue } = require("../broker/broker");
module.exports.registerUser = async (req, res) => {
  try {
    const {
      userName,
      email,
      password,
      fullName: { firstName, lastName },
      role,
    } = req.body;
    const isUserExists = await usermodel.findOne({ email }, { userName });

    if (isUserExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await usermodel.create({
      userName,
      email,
      password: hashedPassword,
      fullName: { firstName, lastName },
      role: role || "user",
    });
    publishToQueue("AUTH_NOTIFICATION.USER_CREATED", {
      id: user._id,
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
    });

    const token = jwt.sign(
      {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal error" });
  }
};

module.exports.loginUser = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    const user = await usermodel
      .findOne({ $or: [{ email }, { userName }] })
      .select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.status(200).json({ message: "User Login successfully", user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal error" });
  }
};

module.exports.getCurrentUser = async (req, res) => {
  return res.status(200).json({
    message: "Current user fatched successfully",
    user: req.user,
  });
};

module.exports.logoutUser = async (req, res) => {
  const token = req.cookies?.token;

  try {
    if (token) {
      await redis.set(`blacklist:${token}`, "true", "EX", 24 * 60 * 60);
    }
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal error" });
  }
};

module.exports.getUserAddresses = async (req, res) => {
  const id = req.user.id;

  // fetch the user's address array (field name is `address` in the model)
  const user = await usermodel.findById(id).select("address");

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }
  return res.status(200).json({
    message: "User addresses fatched successfully",
    addresses: user.address || [],
  });
};

module.exports.addUserAddress = async (req, res) => {
  const id = req.user.id;
  const { street, city, state, pincode, country, isDefault } = req.body;

  // basic validation: pincode should be 6 digits when provided
  if (pincode && !/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ message: "Invalid pincode" });
  }

  const user = await usermodel.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // if this address is marked default, unset previous defaults
  if (isDefault) {
    user.address.forEach((a) => {
      a.isDefault = false;
    });
  }

  user.address.push({ street, city, state, pincode, country, isDefault });
  await user.save();

  const added = user.address[user.address.length - 1];
  return res
    .status(201)
    .json({ message: "User address added successfully", address: added });
};

module.exports.deleteUserAddress = async (req, res) => {
  const id = req.user.id;
  const { addressId } = req.params;

  const user = await usermodel.findOneAndUpdate(
    { _id: id },
    {
      $pull: {
        address: { _id: addressId },
      },
    },
    { new: true },
  );

  if (!user) return res.status(404).json({ message: "User not found" });
  const addExist = user.address.same(
    (addr) => addr.addr_id.toString() === addressId,
  );

  if (addExist) {
    return res.status(500).json({ message: "Failed to delete address" });
  }

  // const addr = user.address.id(addressId);
  // if (!addr) return res.status(404).json({ message: "Address not found" });

  // addr.remove();
  // await user.save();

  return res.status(200).json({
    message: "Address removed successfully",
    addressess: user.address,
  });
};
