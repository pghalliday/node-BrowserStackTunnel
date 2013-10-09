# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|

  # install chef solo on all machines
  config.omnibus.chef_version = :latest

  # enable berkshelf
  config.berkshelf.enabled = true

  config.vm.box = "precise-server-cloudimg-amd64"
  config.vm.box_url = "http://cloud-images.ubuntu.com/vagrant/precise/current/precise-server-cloudimg-amd64-vagrant-disk1.box"

  config.vm.provider :virtualbox do |vb|
    # Give enough horsepower to build without taking all day.
    vb.customize [
      "modifyvm", :id,
      "--memory", "1024",
      "--cpus", "2",
    ]
  end

  config.vm.provision :chef_solo do |chef|
    chef.json = {
      "nodejs" => {
        "install_method" => "package"
      }
    }
    chef.run_list = [
      "recipe[nodejs]"
    ]
  end
end
